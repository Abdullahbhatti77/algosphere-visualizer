import { MinHeap } from "../graph/priority-queue";
import { cellKey, neighbors, sameCell, type Cell, type Grid } from "./grid";
import { heuristics, type HeuristicId } from "./heuristics";

export type GridStepType = "init" | "expand" | "open" | "update" | "skip" | "path" | "done";

export interface CellScore {
  g: number;
  h: number;
  f: number;
}

export interface GridStep {
  type: GridStepType;
  explanation: string;
  current: string | null;
  open: string[];
  closed: string[];
  /** Neighbour being examined in this step. */
  focus: string | null;
  path: string[];
  metrics: { expanded: number; neighborChecks: number; openPushes: number };
  /** Score of the current cell (convenience for display). */
  currentScore: CellScore | null;
  /** Top of the open set, sorted by f. */
  openPreview: { key: string; f: number; g: number; h: number }[];
  found: boolean | null;
  codeLine: number;
}

export interface AStarResult {
  steps: GridStep[];
  /** Final g/h/f of every cell ever discovered. */
  scores: Record<string, CellScore>;
  /** For step-accurate inspection: step index at which a cell's score last changed. */
  path: Cell[] | null;
}

export const ASTAR_PSEUDOCODE = [
  "g[start] ← 0; open ← {start}   // f = g + h",
  "while open not empty:",
  "  current ← cell in open with lowest f",
  "  if current = target: reconstruct path; stop",
  "  move current to closed",
  "  for each neighbor n (4-dir, unit cost):",
  "    if n in closed: skip",
  "    tentative ← g[current] + 1",
  "    if tentative < g[n]: parent[n] ← current; g[n] ← tentative; add/update n in open",
  "no path",
];

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A* on a 4-directional unit-cost grid with a binary heap and lazy deletion.
 * Ties on f break toward larger g (deeper), then by cell key, for determinism.
 */
export function astar(grid: Grid, heuristicId: HeuristicId): AStarResult {
  const h = heuristics[heuristicId].fn;
  const steps: GridStep[] = [];
  const g = new Map<string, number>();
  const hv = new Map<string, number>();
  const parent = new Map<string, string>();
  const cellOf = new Map<string, Cell>();
  const openSet = new Set<string>();
  const closed = new Set<string>();
  const heap = new MinHeap<string>();
  const metrics = { expanded: 0, neighborChecks: 0, openPushes: 0 };
  let current: string | null = null;
  let path: string[] = [];

  const scoreOf = (k: string): CellScore => {
    const gg = g.get(k)!;
    const hh = hv.get(k)!;
    return { g: gg, h: round(hh), f: round(gg + hh) };
  };
  const emit = (
    type: GridStepType,
    explanation: string,
    codeLine: number,
    focus: string | null = null,
    found: boolean | null = null,
  ) => {
    const openList = [...openSet].map((k) => ({ key: k, ...scoreOf(k) }));
    openList.sort((a, b) => a.f - b.f || b.g - a.g || a.key.localeCompare(b.key));
    steps.push({
      type,
      explanation,
      current,
      open: [...openSet],
      closed: [...closed],
      focus,
      path: [...path],
      metrics: { ...metrics },
      currentScore: current ? scoreOf(current) : null,
      openPreview: openList.slice(0, 8),
      found,
      codeLine,
    });
  };
  const push = (k: string) => {
    const f = g.get(k)! + hv.get(k)!;
    // Priority f, tie → larger g first (encoded via tie key), then key.
    heap.push(k, f, `${String(1e6 - g.get(k)!).padStart(8, "0")}|${k}`);
    openSet.add(k);
    metrics.openPushes++;
  };

  const sk = cellKey(grid.start);
  const tk = cellKey(grid.target);
  cellOf.set(sk, grid.start);
  g.set(sk, 0);
  hv.set(sk, h(grid.start, grid.target));
  push(sk);
  emit(
    "init",
    `Add start ${sk} to the open set with g = 0, h = ${round(hv.get(sk)!)}. For A*, f(n) = g(n) + h(n).`,
    0,
  );

  while (heap.size > 0) {
    const { value: k } = heap.pop()!;
    if (closed.has(k)) continue; // stale heap entry (already expanded)
    openSet.delete(k);
    current = k;
    const c = cellOf.get(k)!;
    const s = scoreOf(k);
    if (sameCell(c, grid.target)) {
      closed.add(k);
      metrics.expanded++;
      emit("expand", `Current ${k} is the target (f = ${s.f}). Reconstruct the path.`, 3);
      const rev: string[] = [];
      let p: string | undefined = k;
      while (p) {
        rev.push(p);
        p = parent.get(p);
      }
      rev.reverse();
      for (const key of rev) {
        path.push(key);
        emit(
          "path",
          `Path reconstruction: step ${path.length} of ${rev.length} (${key}).`,
          3,
          key,
          true,
        );
      }
      current = null;
      emit(
        "done",
        `Path found: ${rev.length - 1} moves, ${metrics.expanded} cells expanded.`,
        3,
        null,
        true,
      );
      return {
        steps,
        scores: Object.fromEntries([...g.keys()].map((key) => [key, scoreOf(key)])),
        path: rev.map((r) => cellOf.get(r)!),
      };
    }
    closed.add(k);
    metrics.expanded++;
    emit(
      "expand",
      `Current node ${k}: lowest f = ${s.g} + ${s.h} = ${s.f}. Move it to the closed set.`,
      4,
    );

    for (const n of neighbors(grid, c)) {
      const nk = cellKey(n);
      metrics.neighborChecks++;
      if (closed.has(nk)) {
        emit("skip", `Neighbor ${nk} is already closed, skip.`, 6, nk);
        continue;
      }
      const tentative = g.get(k)! + 1;
      const old = g.get(nk);
      if (old === undefined || tentative < old) {
        cellOf.set(nk, n);
        parent.set(nk, k);
        g.set(nk, tentative);
        if (!hv.has(nk)) hv.set(nk, h(n, grid.target));
        push(nk);
        const ns = scoreOf(nk);
        emit(
          old === undefined ? "open" : "update",
          old === undefined
            ? `Discovered ${nk}: g = ${ns.g}, h = ${ns.h}, f = ${ns.f}. Add to open set.`
            : `Better route to ${nk}: g ${old} → ${ns.g}, f = ${ns.f}.`,
          8,
          nk,
        );
      } else {
        emit(
          "skip",
          `Neighbor ${nk}: g via ${k} would be ${tentative}, not better than ${old}.`,
          8,
          nk,
        );
      }
    }
  }
  current = null;
  emit(
    "done",
    `No path exists: the open set is empty after expanding ${metrics.expanded} cells, so every cell reachable from the start was explored and the target is walled off.`,
    9,
    null,
    false,
  );
  return {
    steps,
    scores: Object.fromEntries([...g.keys()].map((key) => [key, scoreOf(key)])),
    path: null,
  };
}
