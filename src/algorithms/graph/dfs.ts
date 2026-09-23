import { buildAdjacency } from "./graph-model";
import { GraphRecorder } from "./recorder";
import type { GraphStepGenerator } from "./types";

export const DFS_PSEUDOCODE = [
  "stack ← [s]",
  "while stack not empty:",
  "  u ← stack.pop()",
  "  if u visited: continue",
  "  mark u visited",
  "  for each neighbor v of u (reverse order):",
  "    if v not visited: stack.push(v)",
];

/**
 * Iterative DFS with an explicit stack. Neighbours are pushed in reverse label
 * order so they pop in ascending order — the same visit order as the classic
 * recursive formulation. A node may sit on the stack more than once; stale
 * entries are skipped when popped.
 */
export const dfs: GraphStepGenerator = (graph, { source }) => {
  const rec = new GraphRecorder(graph);
  const adj = buildAdjacency(graph);
  if (!adj.has(source)) {
    rec.emit("done", "Choose a source node to start.");
    return rec.steps;
  }
  const visited = new Set<string>();
  const stack: { id: string; via?: string }[] = [{ id: source }];
  const sync = () => (rec.frontier = stack.map((s) => ({ id: s.id })));
  sync();
  rec.nodeStates[source] = "queued";
  rec.metrics.frontierOps++;
  rec.emit("init", `Push ${source} onto the stack.`, 0);

  while (stack.length > 0) {
    const { id: u, via } = stack.pop()!;
    sync();
    if (visited.has(u)) {
      rec.emit("skip", `Popped ${u}, but it is already visited — discard the stale entry.`, 3);
      continue;
    }
    visited.add(u);
    if (via) rec.edgeStates[via] = "tree";
    rec.current = u;
    rec.nodeStates[u] = "current";
    rec.order.push(u);
    rec.metrics.visited++;
    rec.emit("pop", `Popped ${u} from the stack and marked it visited.`, 4);

    const neighbors = adj.get(u)!;
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const { node: v, edge } = neighbors[i]!;
      rec.metrics.edgeChecks++;
      if (!visited.has(v)) {
        stack.push({ id: v, via: edge.id });
        sync();
        rec.nodeStates[v] = "discovered";
        rec.metrics.frontierOps++;
        rec.emit("push", `Checking neighbor ${v} of ${u}: not visited, push it.`, 6);
      } else {
        if (rec.edgeStates[edge.id] === "idle") rec.edgeStates[edge.id] = "considered";
        rec.emit("skip", `Checking neighbor ${v} of ${u}: already visited, skip.`, 6);
      }
    }
    rec.nodeStates[u] = "visited";
    rec.current = null;
  }
  const unreached = graph.nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
  rec.emit(
    "done",
    `DFS complete. Order: ${rec.order.join(" → ")}.` +
      (unreached.length ? ` Unreachable from ${source}: ${unreached.join(", ")}.` : ""),
    1,
  );
  return rec.steps;
};
