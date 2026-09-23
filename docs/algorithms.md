# Algorithms

Full overview, how-it-works, use cases and assumptions are also shown in the app
(the documentation card on each page), generated from `catalog.ts`.

## Sorting

- **Bubble Sort** — adjacent swaps with early exit when a pass makes no swap. Stable, in-place. O(n) best, O(n²) average/worst, O(1) space.
- **Merge Sort** — top-down, auxiliary buffers. Stable, not in-place. O(n log n) all cases, O(n) space. Comparison and overwrite are recorded as one step.
- **Quick Sort** — Lomuto partition, last element as pivot, strict `<`. Not stable, in-place. O(n log n) average; O(n²) on sorted, reverse-sorted and all-equal input. O(log n) average / O(n) worst stack.
- **Heap Sort** — max-heap built bottom-up, then repeated extraction. Not stable, in-place. O(n log n), O(1) space.

## Graphs

- **BFS** — FIFO queue, neighbours visited in label order. O(V + E) time, O(V) space.
- **DFS** — explicit stack (not recursion); neighbours pushed in reverse label order so they pop in label order. O(V + E) time, O(V) space.
- **Dijkstra** — binary min-heap with lazy deletion; rejects negative weights because a finalized distance could otherwise later decrease. O((V + E) log V) time, O(V + E) space.

Graph editor validation rejects self-loops, duplicate edges, negative or
non-finite weights and more than 26 nodes.

## Pathfinding

- **A\*** — 4-directional grid, unit step cost, binary heap with lazy deletion, ties broken by lower h. Manhattan is admissible and consistent here; Euclidean is admissible but less informed. Worst case O(N log N) for N cells, O(N) space.

## Data structures

- **BST** — ordinary unbalanced BST; duplicates rejected. Deletion covers leaf, one child and two children (in-order successor). Search/insert/delete O(h): O(log n) average, O(n) worst on degenerate trees.
- **Stack** — array-backed, bounded to 16 for display. Push/pop/peek O(1); underflow and overflow reported.
- **Queue** — circular buffer, bounded to 16. Enqueue/dequeue/front O(1); underflow reported.
