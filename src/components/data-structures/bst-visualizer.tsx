import { useMemo, useRef, useState } from "react";
import { Minus, Plus, Maximize2 } from "lucide-react";

import { getCatalogEntry } from "@/algorithms/core/catalog";
import {
  buildTree,
  emptyTree,
  height,
  inOrder,
  insertMany,
  MAX_BST_NODES,
  remove,
  search,
  size,
  type BSTree,
  type BSTRole,
} from "@/algorithms/data-structures/bst";
import { BST_NODE_R, layoutTree } from "@/algorithms/data-structures/bst-layout";
import { parseDSValues, randomValues } from "@/algorithms/data-structures/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { DSShell, LegendItem } from "./ds-shell";
import { useDSRunner } from "./use-ds-runner";

const entry = getCatalogEntry("bst");
const DEFAULT_VALUES = [50, 30, 70, 20, 40, 60, 80, 35, 65];

const ROLE_STYLE: Record<BSTRole, { fill: string; stroke: string; mark?: string; dashed?: boolean }> = {
  comparing: { fill: "fill-viz-compare", stroke: "stroke-foreground", mark: "?" },
  path: { fill: "fill-surface", stroke: "stroke-viz-active" },
  found: { fill: "fill-viz-sorted", stroke: "stroke-foreground", mark: "✓" },
  inserted: { fill: "fill-viz-active", stroke: "stroke-foreground", mark: "+" },
  deleted: { fill: "fill-surface", stroke: "stroke-viz-swap", mark: "✕", dashed: true },
  successor: { fill: "fill-viz-pivot", stroke: "stroke-foreground", mark: "S" },
  replaced: { fill: "fill-viz-sorted", stroke: "stroke-viz-active", mark: "↺" },
};

function TreeCanvas({ tree, roles }: { tree: BSTree; roles: Record<number, BSTRole> }) {
  const layout = useMemo(() => layoutTree(tree), [tree]);
  const [zoom, setZoom] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const fit = () => {
    const w = box.current?.clientWidth ?? layout.width;
    setZoom(Math.min(1.4, Math.max(0.8, (w - 8) / layout.width)));
  };
  const ids = Object.keys(tree.nodes).map(Number);
  const onPath = (id: number) => roles[id] !== undefined && roles[id] !== "deleted";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-1">
        <span className="mr-auto text-xs text-muted-foreground">Zoom {Math.round(zoom * 100)}% · scroll or swipe to pan</span>
        <Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(2)))}><Minus className="size-4" /></Button>
        <Button variant="outline" size="icon" aria-label="Fit tree to width" onClick={fit}><Maximize2 className="size-4" /></Button>
        <Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(2)))}><Plus className="size-4" /></Button>
      </div>
      <div ref={box} className="grid-backdrop max-h-[460px] overflow-auto rounded-md border border-border" tabIndex={0} aria-label="Tree canvas, scrollable">
        {tree.root === null ? (
          <p className="p-10 text-center text-sm text-muted-foreground">The tree is empty. Insert a value or generate a random tree.</p>
        ) : (
          <svg
            role="img"
            aria-label={`Binary search tree with ${ids.length} nodes, root ${tree.nodes[tree.root]!.value}`}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width * zoom}
            height={layout.height * zoom}
            className="mx-auto block"
          >
            {ids.map((id) => {
              const n = tree.nodes[id]!;
              const p = layout.positions[id]!;
              return [n.left, n.right].map((c) => {
                if (c === null) return null;
                const q = layout.positions[c]!;
                const hot = onPath(id) && onPath(c);
                return (
                  <line key={`${id}-${c}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={cn(hot ? "stroke-viz-active" : "stroke-border")} strokeWidth={hot ? 3 : 1.5} />
                );
              });
            })}
            {ids.map((id) => {
              const n = tree.nodes[id]!;
              const p = layout.positions[id]!;
              const role = roles[id];
              const st = role ? ROLE_STYLE[role] : { fill: "fill-surface", stroke: "stroke-muted-foreground" };
              return (
                <g key={id} style={{ transform: `translate(${p.x}px, ${p.y}px)` }} className="motion-safe:transition-transform motion-safe:duration-300">
                  {role === "comparing" && <circle r={BST_NODE_R + 5} className="fill-none stroke-viz-compare" strokeWidth={2} />}
                  <circle r={BST_NODE_R} className={cn(st.fill, st.stroke)} strokeWidth={role === "path" ? 3 : 1.5} strokeDasharray={"dashed" in st && st.dashed ? "4 3" : undefined} />
                  <text textAnchor="middle" dy="0.35em" className={cn("fill-foreground font-mono text-[12px] font-semibold", role === "deleted" && "line-through")}>{n.value}</text>
                  {"mark" in st && st.mark && (
                    <g transform={`translate(${BST_NODE_R - 2}, ${-BST_NODE_R + 2})`}>
                      <circle r={7} className="fill-background stroke-foreground" strokeWidth={1} />
                      <text textAnchor="middle" dy="0.35em" className="fill-foreground text-[9px] font-bold">{st.mark}</text>
                    </g>
                  )}
                  {id === tree.root && <text y={-BST_NODE_R - 8} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold uppercase">root</text>}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

export function BSTVisualizer() {
  const r = useDSRunner<BSTree, BSTRole>(() => buildTree(DEFAULT_VALUES));
  const [text, setText] = useState("45");
  const [error, setError] = useState<string | null>(null);
  const tree = r.shown;
  const roles = r.step?.roles ?? {};

  const parse = (max: number) => {
    const p = parseDSValues(text, max);
    if ("error" in p) {
      setError(p.error);
      return null;
    }
    setError(null);
    return p.values;
  };
  const doInsert = () => {
    const v = parse(MAX_BST_NODES);
    if (v) r.run(insertMany(r.committed, v));
  };
  const doSearch = () => {
    const v = parse(1);
    if (v) r.run(search(r.committed, v[0]!));
  };
  const doDelete = () => {
    const v = parse(1);
    if (v) r.run(remove(r.committed, v[0]!));
  };

  return (
    <DSShell
      title="Binary Search Tree (unbalanced)"
      description="Ordinary BST, not AVL or red-black. Nothing rebalances, so the tree's shape and speed depend on insertion order."
      visual={<TreeCanvas tree={tree} roles={roles} />}
      legend={
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          <LegendItem marker="?" label="Comparing" className="bg-viz-compare" />
          <LegendItem marker="" label="Path taken (thick outline)" className="border-2 border-viz-active" />
          <LegendItem marker="✓" label="Found" className="bg-viz-sorted" />
          <LegendItem marker="+" label="Inserted" className="bg-viz-active" />
          <LegendItem marker="✕" label="Being deleted" className="border-dashed border-viz-swap" />
          <LegendItem marker="S" label="Successor" className="bg-viz-pivot" />
          <LegendItem marker="↺" label="Replaced value" className="bg-viz-sorted" />
        </ul>
      }
      operations={
        <>
          <div className="space-y-1.5">
            <Label htmlFor="bst-value">Value(s), 0–999</Label>
            <Input
              id="bst-value"
              inputMode="numeric"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doInsert()}
              aria-describedby="bst-help"
              aria-invalid={error ? true : undefined}
            />
            <p id="bst-help" className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>
              {error ?? "Insert accepts a comma-separated list; search and delete use the first value."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={doInsert}>Insert</Button>
            <Button variant="outline" onClick={doSearch}>Search</Button>
            <Button variant="outline" onClick={doDelete}>Delete</Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={() => r.replace(buildTree(randomValues(10, Math.random, true)))}>Random tree</Button>
            <Button variant="secondary" onClick={() => r.replace(emptyTree())}>Reset</Button>
            <Button variant="secondary" onClick={() => r.run(insertMany(emptyTree(), [10, 20, 30, 40, 50, 60]))}>Sorted insert</Button>
          </div>
          <p className="text-xs text-muted-foreground">Sorted insert builds a chain from an empty tree — the O(n) worst case.</p>
        </>
      }
      operationName={r.result?.operation ?? null}
      explanation={r.step?.explanation ?? null}
      status={r.step?.status ?? null}
      pseudocode={r.result?.pseudocode ?? null}
      codeLine={r.step?.codeLine}
      contents={{ label: "In-order", text: tree.root === null ? "(empty)" : inOrder(tree).join(", ") }}
      stats={{
        ids: entry.stats,
        values: {
          step: r.steps.length ? `${r.player.index + 1}/${r.steps.length}` : "—",
          treeComparisons: r.step ? r.step.work : null,
          size: size(tree),
          height: height(tree),
          operations: r.steps.length ? r.result!.operation : "—",
        },
        labels: { treeComparisons: "Comparisons (this op)", operations: "Last operation", height: "Height (levels)" },
      }}
      complexity={entry.complexity}
      player={r.player}
      totalSteps={r.steps.length}
      speed={r.speed}
      onSpeedChange={r.setSpeed}
    />
  );
}
