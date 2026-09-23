/**
 * Typed catalogue of every algorithm and data structure in AlgoViz.
 *
 * Engine-only: `visualizer` is a string key; the UI layer maps it to a
 * component, so this module never imports React. Adding an algorithm means
 * adding one entry here (plus its engine and, if new, a visualizer).
 */
import { BST_PSEUDOCODE, insert as bstInsert, remove as bstRemove, search as bstSearch } from "../data-structures/bst";
import { QUEUE_PSEUDOCODE, dequeue, enqueue, peekQueue } from "../data-structures/queue";
import { STACK_PSEUDOCODE, peek as stackPeek, pop as stackPop, push as stackPush } from "../data-structures/stack";
import { graphAlgorithms } from "../graph/registry";
import { ASTAR_PSEUDOCODE, astar } from "../pathfinding/astar";
import { sortingAlgorithms } from "../registry";
import type { AlgorithmCategory, ComplexityMeta } from "./complexity";
import type { StatId } from "./stats";

export type VisualizerKey = "bar-chart" | "graph" | "grid" | "bst" | "stack" | "queue";

export interface CatalogEntry {
  id: string;
  category: AlgorithmCategory;
  displayName: string;
  description: string;
  complexity: ComplexityMeta;
  /** Single listing, or one listing per operation for data structures. */
  pseudocode: readonly string[] | Readonly<Record<string, readonly string[]>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  implementation: ((...args: any[]) => unknown) | Readonly<Record<string, (...args: any[]) => unknown>>;
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
  visualizer: "bar-chart",
  stats: ["step", "comparisons", "swaps", "accesses", "elapsed", "computeTime"],
}));

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
  visualizer: "graph",
  stats: ["step", a.id === "dijkstra" ? "processed" : "visited", "edgeChecks", "frontierOps", "elapsed", "computeTime"],
}));

const astarEntry: CatalogEntry = {
  id: "astar",
  category: "pathfinding",
  displayName: "A* Search",
  description: "Best-first grid search ordered by f(n) = g(n) + h(n): cost so far plus an admissible estimate of the remaining cost.",
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
    notation: [{ symbol: "n", meaning: "number of nodes" }, { symbol: "h", meaning: "tree height" }],
  },
  pseudocode: BST_PSEUDOCODE,
  implementation: { insert: bstInsert, search: bstSearch, delete: bstRemove },
  visualizer: "bst",
  stats: ["step", "treeComparisons", "size", "height", "operations"],
};

const stackEntry: CatalogEntry = {
  id: "stack",
  category: "data-structure",
  displayName: "Stack",
  description: "Last in, first out. Items are added and removed only at the top, backed here by a contiguous array plus a size counter.",
  complexity: {
    name: "Stack",
    category: "data-structure",
    bestTime: "O(1)",
    averageTime: "O(1)",
    worstTime: "O(1)",
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
  implementation: { push: stackPush, pop: stackPop, peek: stackPeek },
  visualizer: "stack",
  stats: ["step", "stackOps", "size", "capacity", "operations"],
};

const queueEntry: CatalogEntry = {
  id: "queue",
  category: "data-structure",
  displayName: "Queue",
  description: "First in, first out. Items join at the rear and leave from the front, stored in a circular buffer so neither end ever shifts the other items.",
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
      { operation: "Enqueue", average: "O(1)", worst: "O(1)" },
      { operation: "Dequeue", average: "O(1)", worst: "O(1)" },
      { operation: "Peek / front", average: "O(1)", worst: "O(1)" },
    ],
  },
  pseudocode: QUEUE_PSEUDOCODE,
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
