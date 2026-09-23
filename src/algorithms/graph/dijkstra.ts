import { buildAdjacency, hasNegativeWeight } from "./graph-model";
import { MinHeap } from "./priority-queue";
import { GraphRecorder, formatDistance } from "./recorder";
import type { GraphStepGenerator } from "./types";

export const DIJKSTRA_PSEUDOCODE = [
  "dist[*] ← ∞; dist[s] ← 0; heap ← {(0, s)}",
  "while heap not empty:",
  "  (d, u) ← heap.extractMin()",
  "  if u finalized: continue   // stale entry",
  "  finalize u",
  "  for each edge (u, v, w):",
  "    if dist[u] + w < dist[v]:",
  "      dist[v] ← dist[u] + w; prev[v] ← u; heap.insert(v)",
  "reconstruct path by following prev from target",
];

export class NegativeWeightError extends Error {}

/** Result helper for tests / summaries. */
export function reconstructPath(prev: Record<string, string | null>, source: string, target: string): string[] | null {
  const path: string[] = [];
  let cur: string | null | undefined = target;
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur)) return null;
    guard.add(cur);
    path.unshift(cur);
    if (cur === source) return path;
    cur = prev[cur];
  }
  return null;
}

/** Dijkstra with a binary min-heap and lazy deletion. Requires weights ≥ 0. */
export const dijkstra: GraphStepGenerator = (graph, { source, target }) => {
  if (hasNegativeWeight(graph)) {
    throw new NegativeWeightError("Dijkstra requires non-negative edge weights.");
  }
  const rec = new GraphRecorder(graph);
  const adj = buildAdjacency(graph);
  if (!adj.has(source)) {
    rec.emit("done", "Choose a source node to start.");
    return rec.steps;
  }
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const prevEdge: Record<string, string> = {};
  for (const n of graph.nodes) {
    dist[n.id] = Infinity;
    prev[n.id] = null;
  }
  dist[source] = 0;
  rec.distances = dist;
  rec.predecessors = prev;
  const heap = new MinHeap<string>();
  heap.push(source, 0, source);
  const sync = () => (rec.frontier = heap.snapshot().map((e) => ({ id: e.value, priority: e.priority })));
  sync();
  rec.nodeStates[source] = "queued";
  rec.metrics.frontierOps++;
  rec.emit("init", `Set dist[${source}] = 0 and every other distance to ∞.`, 0);

  const finalized = new Set<string>();
  while (heap.size > 0) {
    const { value: u, priority: d } = heap.pop()!;
    sync();
    if (finalized.has(u)) {
      rec.emit("skip", `Extracted stale entry (${d}, ${u}); ${u} is already finalized.`, 3);
      continue;
    }
    finalized.add(u);
    rec.current = u;
    rec.nodeStates[u] = "current";
    rec.order.push(u);
    rec.metrics.visited++;
    rec.emit("finalize", `Current minimum-distance node is ${u} (dist ${d}). Finalize it.`, 4);
    if (target && u === target) {
      rec.nodeStates[u] = "visited";
      rec.emit("finalize", `Target ${u} finalized — its shortest distance can no longer improve. Stop early.`, 4);
      break;
    }
    for (const { node: v, edge } of adj.get(u)!) {
      rec.metrics.edgeChecks++;
      if (finalized.has(v)) {
        rec.emit("skip", `Checking neighbor ${v}: already finalized, skip.`, 5);
        continue;
      }
      const candidate = dist[u]! + edge.weight;
      if (candidate < dist[v]!) {
        const old = dist[v]!;
        dist[v] = candidate;
        prev[v] = u;
        if (prevEdge[v]) rec.edgeStates[prevEdge[v]!] = "considered";
        prevEdge[v] = edge.id;
        rec.edgeStates[edge.id] = "relaxed";
        heap.push(v, candidate, v);
        sync();
        rec.nodeStates[v] = "queued";
        rec.metrics.frontierOps++;
        rec.emit(
          "relax",
          `Updated distance of ${v} from ${formatDistance(old)} to ${candidate} via ${u} (${dist[u]} + ${edge.weight}).`,
          7,
        );
      } else {
        if (rec.edgeStates[edge.id] === "idle") rec.edgeStates[edge.id] = "considered";
        rec.emit("no-improve", `Checking neighbor ${v}: ${dist[u]} + ${edge.weight} = ${candidate} is not better than ${dist[v]}.`, 6);
      }
    }
    rec.nodeStates[u] = "visited";
    rec.current = null;
  }

  if (target) {
    const path = dist[target] === Infinity ? null : reconstructPath(prev, source, target);
    if (path) {
      rec.path = [];
      for (let i = 0; i < path.length; i++) {
        const id = path[i]!;
        rec.path.push(id);
        rec.nodeStates[id] = "path";
        if (i > 0) rec.edgeStates[prevEdge[id]!] = "path";
        rec.emit("path", `Path reconstruction: ${rec.path.join(" → ")}.`, 8);
      }
      rec.emit("done", `Shortest path ${path.join(" → ")}, total cost ${dist[target]}.`, 8);
    } else {
      rec.emit("done", `${target} is unreachable from ${source}: no sequence of edges connects them.`, 8);
    }
  } else {
    rec.emit("done", "All reachable nodes finalized with their shortest distances.", 1);
  }
  return rec.steps;
};
