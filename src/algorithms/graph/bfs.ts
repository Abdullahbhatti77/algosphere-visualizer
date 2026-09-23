import { buildAdjacency } from "./graph-model";
import { GraphRecorder } from "./recorder";
import type { GraphStepGenerator } from "./types";

export const BFS_PSEUDOCODE = [
  "mark s discovered; queue ← [s]",
  "while queue not empty:",
  "  u ← queue.dequeue()",
  "  mark u visited",
  "  for each neighbor v of u:",
  "    if v undiscovered:",
  "      mark v discovered; queue.enqueue(v)",
  "    else skip v",
];

/** Queue-based breadth-first search from `source`. */
export const bfs: GraphStepGenerator = (graph, { source }) => {
  const rec = new GraphRecorder(graph);
  const adj = buildAdjacency(graph);
  if (!adj.has(source)) {
    rec.emit("done", "Choose a source node to start.");
    return rec.steps;
  }
  const discovered = new Set<string>([source]);
  const queue: string[] = [source];
  rec.frontier = [{ id: source }];
  rec.nodeStates[source] = "queued";
  rec.metrics.frontierOps++;
  rec.emit("init", `Start at ${source}: mark it discovered and enqueue it.`, 0);

  while (queue.length > 0) {
    const u = queue.shift()!;
    rec.frontier = queue.map((id) => ({ id }));
    rec.current = u;
    rec.nodeStates[u] = "current";
    rec.emit("dequeue", `Dequeued node ${u}.`, 2);
    rec.order.push(u);
    rec.metrics.visited++;

    for (const { node: v, edge } of adj.get(u)!) {
      rec.metrics.edgeChecks++;
      if (!discovered.has(v)) {
        discovered.add(v);
        queue.push(v);
        rec.frontier = queue.map((id) => ({ id }));
        rec.nodeStates[v] = "queued";
        rec.edgeStates[edge.id] = "tree";
        rec.metrics.frontierOps++;
        rec.emit("enqueue", `Checking neighbor ${v} of ${u}: undiscovered, so enqueue it.`, 6);
      } else {
        if (rec.edgeStates[edge.id] === "idle") rec.edgeStates[edge.id] = "considered";
        rec.emit("skip", `Checking neighbor ${v} of ${u}: already discovered, skip.`, 7);
      }
    }
    rec.nodeStates[u] = "visited";
    rec.current = null;
    rec.emit("visit", `Finished ${u}; all its neighbors have been examined.`, 3);
  }
  const unreached = graph.nodes.filter((n) => !discovered.has(n.id)).map((n) => n.id);
  rec.emit(
    "done",
    `BFS complete. Order: ${rec.order.join(" → ")}.` +
      (unreached.length ? ` Unreachable from ${source}: ${unreached.join(", ")}.` : ""),
    1,
  );
  return rec.steps;
};
