/**
 * Typed catalogue of every algorithm and data structure in AlgoViz.
 *
 * Engine-only: `visualizer` is a string key; the UI layer maps it to a
 * component, so this module never imports React. Adding an algorithm means
 * adding one entry here (plus its engine and, if new, a visualizer).
 */
import {
  BST_PSEUDOCODE,
  insert as bstInsert,
  remove as bstRemove,
  search as bstSearch,
} from "../data-structures/bst";
import { QUEUE_PSEUDOCODE, dequeue, enqueue, peekQueue } from "../data-structures/queue";
import {
  STACK_PSEUDOCODE,
  peek as stackPeek,
  pop as stackPop,
  push as stackPush,
} from "../data-structures/stack";
import { graphAlgorithms } from "../graph/registry";
import { ASTAR_PSEUDOCODE, astar } from "../pathfinding/astar";
import { sortingAlgorithms } from "../registry";
import type { AlgorithmCategory, ComplexityMeta } from "./complexity";
import type { StatId } from "./stats";

export type VisualizerKey = "bar-chart" | "graph" | "grid" | "bst" | "stack" | "queue";

/** Student-facing documentation, rendered by one shared panel. */
export interface AlgorithmDocs {
  overview: string;
  howItWorks: string[];
  whenUseful: string[];
  /** Implementation choices the visualisation and bounds depend on. */
  implementationNotes: string[];
}

export interface CatalogEntry {
  docs: AlgorithmDocs;
  id: string;
  category: AlgorithmCategory;
  displayName: string;
  description: string;
  complexity: ComplexityMeta;
  /** Single listing, or one listing per operation for data structures. */
  pseudocode: readonly string[] | Readonly<Record<string, readonly string[]>>;
  implementation: ((...args: never[]) => unknown) | Readonly<Record<string, (...args: never[]) => unknown>>;
  visualizer: VisualizerKey;
  /** Statistics this entry genuinely tracks; nothing else is displayed. */
  stats: readonly StatId[];
}

const sortingEntries: CatalogEntry[] = sortingAlgorithms.map((a) => ({
  id: a.id,
  category: "sorting",
  displayName: a.name,
  description: a.overview,
  complexity: {
    name: a.name,
    category: "sorting",
    bestTime: a.complexity.best,
    averageTime: a.complexity.average,
    worstTime: a.complexity.worst,
    space: a.complexity.space,
    stable: a.stable,
    inPlace: a.inPlace,
    description: a.tagline,
    assumptions: [a.complexity.notes],
  },
  pseudocode: a.pseudocode,
  implementation: a.generate,
  docs: {
    overview: a.overview,
    howItWorks: a.howItWorks,
    whenUseful: a.practicalNotes,
    implementationNotes: [a.complexity.notes],
  },
  visualizer: "bar-chart",
  stats: ["step", "comparisons", "swaps", "accesses", "elapsed", "computeTime"],
}));

const GRAPH_DOCS: Record<"bfs" | "dfs" | "dijkstra", AlgorithmDocs> = {
  bfs: {
    overview:
      "Breadth-first search explores a graph in layers: every node one edge from the source, then every node two edges away, and so on.",
    howItWorks: [
      "Mark the source discovered and enqueue it.",
      "Dequeue the front node and visit it.",
      "For each neighbour not yet discovered, mark it discovered and enqueue it.",
      "Repeat until the queue is empty.",
    ],
    whenUseful: [
      "Shortest paths by number of edges in unweighted graphs.",
      "Connectivity checks, bipartite testing, and level-order traversal.",
    ],
    implementationNotes: [
      "Iterative with a FIFO queue; nodes are marked when enqueued, so each is enqueued at most once.",
      "Neighbours are processed in label order, so traversal order is deterministic.",
    ],
  },
  dfs: {
    overview:
      "Depth-first search follows one branch as far as it can before backtracking to the most recent node with unexplored neighbours.",
    howItWorks: [
      "Push the source onto the stack.",
      "Pop a node; if already visited, discard it (stale entry).",
      "Otherwise visit it and push its unvisited neighbours.",
      "Repeat until the stack is empty.",
    ],
    whenUseful: [
      "Cycle detection, topological sorting, strongly connected components, maze generation.",
      "Exploring every reachable node with little bookkeeping.",
    ],
    implementationNotes: [
      "Explicit stack, not recursion. Neighbours are pushed in reverse label order, so visit order equals recursive DFS in label order.",
      "A node may be pushed more than once; duplicates are skipped when popped, so the stack can hold O(E) entries.",
    ],
  },
  dijkstra: {
    overview:
      "Dijkstra's algorithm computes shortest-path distances from one source when every edge weight is non-negative.",
    howItWorks: [
      "Set dist(source) = 0 and every other distance to ∞; insert the source into a min-heap.",
      "Extract the node with the smallest tentative distance; skip it if it is already finalized.",
      "Finalize it and relax each outgoing edge: if dist(u) + w < dist(v), update dist(v), record u as v's predecessor, and insert v.",
      "Stop when the heap is empty or the target is finalized; follow predecessors back for the path.",
    ],
    whenUseful: [
      "Road networks, network routing and any weighted graph without negative edges.",
      "Not suitable with negative weights — use Bellman–Ford instead.",
    ],
    implementationNotes: [
      "Binary min-heap with lazy deletion rather than decrease-key.",
      "Negative weights are rejected before running, because finalizing the closest node would no longer be safe.",
      "Ties are broken by label for deterministic output.",
    ],
  },
};

const graphEntries: CatalogEntry[] = graphAlgorithms.map((a) => ({
  id: a.id,
  category: "graph",
  displayName: a.name,
  description: a.overview,
  complexity: {
    name: a.name,
    category: "graph",
    bestTime: a.complexity.time,
    averageTime: a.complexity.time,
    worstTime: a.complexity.time,
    space: a.complexity.space,
    description: a.tagline,
    assumptions: [a.complexity.notes],
  },
  pseudocode: a.pseudocode,
  implementation: a.generate,
  docs: GRAPH_DOCS[a.id],
  visualizer: "graph",
  stats: [
    "step",
    a.id === "dijkstra" ? "processed" : "visited",
    "edgeChecks",
    "frontierOps",
    "elapsed",
    "computeTime",
  ],
}));

const astarEntry: CatalogEntry = {
  id: "astar",
  category: "pathfinding",
  displayName: "A* Search",
  description:
    "Best-first grid search ordered by f(n) = g(n) + h(n): cost so far plus an admissible estimate of the remaining cost.",
  complexity: {
    name: "A* Search",
    category: "pathfinding",
    bestTime: "O(V log V)",
    averageTime: "O(V log V)",
    worstTime: "O(V log V)",
    space: "O(V)",
    description: "Upper bound on a 4-neighbour unit-cost grid with a binary heap.",
    assumptions: [
      "4-neighbour grid, so E ≤ 4V. With a consistent heuristic each cell is expanded at most once; the binary heap makes each insert/extract O(log V). A better-informed heuristic expands fewer cells in practice but does not change the worst case (a fully walled-off target forces exploring every reachable cell).",
    ],
    notation: [{ symbol: "V", meaning: "rows × cols" }],
  },
  pseudocode: ASTAR_PSEUDOCODE,
  implementation: astar,
  docs: {
    overview:
      "A* finds a shortest path from start to target by always expanding the open cell with the lowest f(n) = g(n) + h(n): the exact cost from the start plus a heuristic estimate of the remaining cost.",
    howItWorks: [
      "Put the start cell in the open set with g = 0.",
      "Repeatedly remove the open cell with the smallest f (ties: larger g, then row/column order) and move it to the closed set.",
      "If it is the target, follow parent links back to the start to reconstruct the path.",
      "Otherwise, for each walkable neighbour, compute a tentative g; if it improves on the best known g, record the parent and (re)insert it into the open set.",
      "If the open set empties first, no path exists.",
    ],
    whenUseful: [
      "Route finding on maps and game grids when a good distance estimate is available.",
      "With h = 0 it degenerates to Dijkstra; with an admissible, consistent heuristic it stays optimal while exploring fewer cells.",
    ],
    implementationNotes: [
      "4-directional movement, every step costs 1, walls are impassable.",
      "Manhattan distance is exact on an empty 4-neighbour grid; Euclidean is smaller or equal, so both are admissible and consistent — each cell is closed at most once.",
      "Open set is a binary min-heap with lazy deletion (stale entries skipped when popped).",
    ],
  },
  visualizer: "grid",
  stats: ["step", "explored", "neighborChecks", "pathLength", "elapsed", "computeTime"],
};

const bstEntry: CatalogEntry = {
  id: "bst",
  category: "data-structure",
  displayName: "Binary Search Tree",
  description:
    "An ordinary, unbalanced binary search tree: every key in a node's left subtree is smaller and every key in its right subtree is larger. No AVL or red-black rebalancing is performed.",
  complexity: {
    name: "Binary Search Tree",
    category: "data-structure",
    bestTime: "O(1)",
    averageTime: "O(log n)",
    worstTime: "O(n)",
    space: "O(n)",
    description: "Every operation walks one root-to-node path, so its cost is the tree height h.",
    assumptions: [
      "Cost of search, insert and delete is O(h). Average O(log n) assumes keys arrive in random order, giving expected height about 2·ln n.",
      "Worst case O(n): inserting sorted keys builds a chain (try the Sorted insert preset). This tree does not rebalance.",
      "Best case O(1): the key is at, or belongs directly under, the root.",
      "Space is O(n) for the nodes; the iterative walks shown use O(1) extra space.",
    ],
    operations: [
      { operation: "Search", average: "O(log n)", worst: "O(n)" },
      { operation: "Insert", average: "O(log n)", worst: "O(n)" },
      { operation: "Delete", average: "O(log n)", worst: "O(n)" },
    ],
    notation: [
      { symbol: "n", meaning: "number of nodes" },
      { symbol: "h", meaning: "tree height" },
    ],
  },
  pseudocode: BST_PSEUDOCODE,
  docs: {
    overview:
      "A binary search tree keeps keys ordered so that an in-order walk visits them in sorted order. Every operation follows a single root-to-leaf path.",
    howItWorks: [
      "Search: compare with the current node; equal means found, smaller goes left, larger goes right; an empty child means absent.",
      "Insert: search for the key; the empty child where the search stops is where the new node goes. Duplicates are rejected.",
      "Delete (leaf): detach the node. Delete (one child): link the parent directly to that child.",
      "Delete (two children): copy the in-order successor (leftmost node of the right subtree) into the node, then remove the successor, which has at most one child.",
    ],
    whenUseful: [
      "Ordered sets and maps where you also need range queries, predecessor/successor or sorted iteration.",
      "Teaching the idea behind balanced trees: this unbalanced version shows exactly why AVL and red-black trees exist.",
    ],
    implementationNotes: [
      "No rebalancing — shape depends entirely on insertion order.",
      "Keys are unique integers 0–999; the view is capped at 31 nodes to stay legible.",
      "Deletion uses the successor, not the predecessor.",
    ],
  },
  implementation: { insert: bstInsert, search: bstSearch, delete: bstRemove },
  visualizer: "bst",
  stats: ["step", "treeComparisons", "size", "height", "operations"],
};

const stackEntry: CatalogEntry = {
  id: "stack",
  category: "data-structure",
  displayName: "Stack",
  description:
    "Last in, first out. Items are added and removed only at the top, backed here by a contiguous array plus a size counter.",
  complexity: {
    name: "Stack",
    category: "data-structure",
    bestTime: "O(1)",
    averageTime: "O(1)",
    worstTime: "O(1) bounded, O(n) resize",
    space: "O(n)",
    description: "Array-backed: the top is always index size − 1.",
    assumptions: [
      "Bounded mode uses a fixed array, so every operation is O(1) in the worst case and a full stack reports overflow.",
      "An unbounded dynamic array would make push amortised O(1) (occasional O(n) resize). This view caps it at 16 items for legibility.",
    ],
    operations: [
      { operation: "Push", average: "O(1)", worst: "O(1)" },
      { operation: "Pop", average: "O(1)", worst: "O(1)" },
      { operation: "Peek", average: "O(1)", worst: "O(1)" },
    ],
  },
  pseudocode: STACK_PSEUDOCODE,
  docs: {
    overview:
      "A stack is a last-in, first-out collection: the most recently pushed item is the first one popped.",
    howItWorks: [
      "Push writes the value at index size and increments size.",
      "Pop checks for emptiness (underflow), reads index size − 1, then decrements size.",
      "Peek reads index size − 1 without changing anything.",
    ],
    whenUseful: [
      "Function call stacks, undo history, expression evaluation and bracket matching.",
      "Depth-first search — the DFS on the Graphs page uses exactly this structure.",
    ],
    implementationNotes: [
      "Array-backed; the top is always index size − 1.",
      "Bounded mode (capacity 8) reports overflow; unbounded mode is capped at 16 items for display.",
    ],
  },
  implementation: { push: stackPush, pop: stackPop, peek: stackPeek },
  visualizer: "stack",
  stats: ["step", "stackOps", "size", "capacity", "operations"],
};

const queueEntry: CatalogEntry = {
  id: "queue",
  category: "data-structure",
  displayName: "Queue",
  description:
    "First in, first out. Items join at the rear and leave from the front, stored in a circular buffer so neither end ever shifts the other items.",
  complexity: {
    name: "Queue",
    category: "data-structure",
    bestTime: "O(1)",
    averageTime: "O(1)",
    worstTime: "O(1)",
    space: "O(n)",
    description: "Circular buffer with head index and size.",
    assumptions: [
      "Bounded mode: fixed buffer, every operation O(1) worst case; a full queue reports overflow.",
      "Unbounded mode doubles the buffer when full, which costs O(n) once but keeps enqueue amortised O(1). Capped at 16 items for legibility.",
      "Dequeue advances head modulo capacity instead of shifting items, which is what keeps it O(1).",
    ],
    operations: [
      { operation: "Enqueue", average: "O(1)", worst: "O(1) bounded, O(n) resize" },
      { operation: "Dequeue", average: "O(1)", worst: "O(1)" },
      { operation: "Peek / front", average: "O(1)", worst: "O(1)" },
    ],
  },
  pseudocode: QUEUE_PSEUDOCODE,
  docs: {
    overview: "A queue is a first-in, first-out collection: items leave in the order they arrived.",
    howItWorks: [
      "Enqueue writes at slot (head + size) mod capacity and increments size.",
      "Dequeue checks for emptiness (underflow), reads slot head, clears it, and advances head modulo capacity.",
      "Front reads slot head without changing anything.",
    ],
    whenUseful: [
      "Task scheduling, buffering between producers and consumers, and message queues.",
      "Breadth-first search — the BFS on the Graphs page uses this structure.",
    ],
    implementationNotes: [
      "Circular buffer: dequeue never shifts items, which is what keeps it O(1).",
      "Unbounded mode doubles the buffer when full (one O(n) copy, amortised O(1)); bounded mode reports overflow.",
    ],
  },
  implementation: { enqueue, dequeue, peek: peekQueue },
  visualizer: "queue",
  stats: ["step", "queueOps", "size", "capacity", "operations"],
};

export const algorithmRegistry: readonly CatalogEntry[] = [
  ...sortingEntries,
  ...graphEntries,
  astarEntry,
  bstEntry,
  stackEntry,
  queueEntry,
];

export function getCatalogEntry(id: string): CatalogEntry {
  const entry = algorithmRegistry.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown algorithm "${id}"`);
  return entry;
}

export function entriesByCategory(category: AlgorithmCategory): CatalogEntry[] {
  return algorithmRegistry.filter((e) => e.category === category);
}
