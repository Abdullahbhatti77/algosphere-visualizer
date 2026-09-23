import { BFS_PSEUDOCODE, bfs } from "./bfs";
import { DFS_PSEUDOCODE, dfs } from "./dfs";
import { DIJKSTRA_PSEUDOCODE, dijkstra } from "./dijkstra";
import type { GraphAlgorithmDefinition } from "./types";

export const graphAlgorithms: GraphAlgorithmDefinition[] = [
  {
    id: "bfs",
    name: "Breadth-First Search",
    tagline: "Explores level by level using a FIFO queue.",
    overview:
      "BFS visits every node at distance k from the source before any node at distance k + 1, so in an unweighted graph it finds shortest paths by edge count.",
    implementation: "Iterative, FIFO queue. Nodes are marked discovered when enqueued, so each enters the queue at most once.",
    pseudocode: BFS_PSEUDOCODE,
    frontierLabel: "Queue (front → back)",
    complexity: {
      time: "O(V + E)",
      space: "O(V)",
      notes: "Adjacency-list representation; each node is enqueued once and each edge examined once (twice if undirected).",
    },
    usesWeights: false,
    usesTarget: false,
    generate: bfs,
  },
  {
    id: "dfs",
    name: "Depth-First Search",
    tagline: "Dives as deep as possible before backtracking, using a stack.",
    overview:
      "DFS follows one branch until it runs out of unvisited neighbours, then backtracks. It underpins cycle detection, topological sort, and connected components.",
    implementation:
      "Explicit stack (iterative), not recursion. Neighbours are pushed in reverse label order so the visit order matches recursive DFS. A node can be pushed more than once; stale entries are discarded when popped.",
    pseudocode: DFS_PSEUDOCODE,
    frontierLabel: "Stack (bottom → top)",
    complexity: {
      time: "O(V + E)",
      space: "O(V + E)",
      notes:
        "Adjacency list. This push-all-neighbours variant can hold up to O(E) stack entries; a recursive DFS needs O(V) call-stack space.",
    },
    usesWeights: false,
    usesTarget: false,
    generate: dfs,
  },
  {
    id: "dijkstra",
    name: "Dijkstra's Algorithm",
    tagline: "Single-source shortest paths for non-negative weights.",
    overview:
      "Dijkstra repeatedly finalizes the unfinalized node with the smallest tentative distance and relaxes its outgoing edges. It is correct only when all edge weights are non-negative.",
    implementation:
      "Binary min-heap with lazy deletion: improved distances are inserted as new entries and stale entries are skipped when extracted. Stops early once the target is finalized.",
    pseudocode: DIJKSTRA_PSEUDOCODE,
    frontierLabel: "Min-heap (priority order)",
    complexity: {
      time: "O((V + E) log V)",
      space: "O(V + E)",
      notes:
        "Binary heap with lazy deletion holds up to O(E) entries; log E = O(log V). A Fibonacci heap would give O(E + V log V), but that is not what runs here.",
    },
    usesWeights: true,
    usesTarget: true,
    generate: dijkstra,
  },
];

export function getGraphAlgorithm(id: string): GraphAlgorithmDefinition {
  return graphAlgorithms.find((a) => a.id === id) ?? graphAlgorithms[0]!;
}
