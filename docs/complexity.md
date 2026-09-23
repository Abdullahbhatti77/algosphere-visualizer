# Complexity

Complexity values in AlgoViz describe the implementations in this repository, not every possible implementation of the underlying algorithm.

## Metadata Design

Complexity metadata is stored with each algorithm entry and rendered by shared UI panels. Entries include:

- best-case time
- average-case time
- worst-case time
- space usage
- implementation assumptions
- operation-level bounds for data structures where useful
- notation notes such as V for vertices or E for edges

The same metadata supports the README, in-app complexity panels, and tests that check documentation completeness.

## Summary Table

| Algorithm | Best Time | Average Time | Worst Time | Space | Assumptions |
| --- | --- | --- | --- | --- | --- |
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Early-exit flag is implemented. |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Top-down recursion with auxiliary buffers. |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) avg, O(n) worst | Lomuto partition, last-element pivot, strict `<`. |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | In-place max-heap with iterative sift-down. |
| BFS | O(V + E) | O(V + E) | O(V + E) | O(V) | Adjacency-list traversal. |
| DFS | O(V + E) | O(V + E) | O(V + E) | O(V + E) | Explicit stack variant can contain stale duplicate entries. |
| Dijkstra | O((V + E) log V) | O((V + E) log V) | O((V + E) log V) | O(V + E) | Binary min-heap with lazy deletion; non-negative weights only. |
| A* | O(V log V) | O(V log V) | O(V log V) | O(V) | 4-neighbor unit-cost grid; binary heap; V = cells. |
| BST search/insert/delete | O(1) | O(log n) | O(n) | O(n) | Ordinary unbalanced BST; average assumes random insertion shape. |
| Stack push/pop/peek | O(1) | O(1) | O(1) | O(n) | Array-backed educational model. |
| Queue enqueue/dequeue/front | O(1) | O(1) amortized | O(1) bounded / O(n) resize | O(n) | Circular buffer; growable mode may resize. |

## Implementation-Specific Notes

### Sorting

Bubble Sort's O(n) best case depends on the early-exit flag. Without that flag, a sorted array would still require every pass.

Merge Sort uses auxiliary buffers for each merge. That keeps the merge logic readable and stable, but it means the implementation is not in-place.

Quick Sort uses the last element as pivot. Sorted, reverse-sorted, and all-equal arrays can produce O(n²) comparisons because each partition removes only one pivot from the remaining problem. This is intentionally documented rather than hidden.

Heap Sort uses iterative sift-down and stores the heap inside the array, so auxiliary space is O(1).

### Graph Algorithms

BFS uses a FIFO queue and marks nodes when enqueued, which bounds queue entries to O(V).

DFS uses an explicit stack and pushes unvisited neighbors. Because a node can be pushed more than once before it is visited, the stack can contain stale entries. That is why the implemented space bound is O(V + E), not just O(V).

Dijkstra uses a binary heap with lazy deletion. It does not implement decrease-key; improved distances are inserted as new heap entries and older entries are skipped when extracted. This makes the heap storage O(V + E) in the worst case.

### A*

A* is implemented for a 4-directional grid with unit movement costs. Manhattan and Euclidean heuristics are admissible and consistent in this setting. Worst-case complexity is still O(V log V) because a poor layout or unreachable target can force exploration of every reachable cell.

### Data Structures

The binary search tree is intentionally ordinary and unbalanced. Its operation cost is O(h), where h is height. In average random insertion order h is O(log n), but sorted insertion can create a chain with h = n.

The stack is array-backed. The queue is a circular buffer, so dequeue does not shift all elements. In growable queue mode, resizing is an occasional O(n) copy; bounded mode reports overflow instead.

## Algorithm Cost vs Visualization Cost

The complexity values above describe the algorithm implementations. The visualizer also stores a sequence of steps and renders them in the browser. That introduces additional memory proportional to the number and size of recorded snapshots.

AlgoViz is therefore not a benchmark suite. The app intentionally limits input sizes so that traces are educational, readable, and responsive.
