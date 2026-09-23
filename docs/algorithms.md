# Algorithms

This document describes the algorithms currently implemented in AlgoViz. The implementations are ordinary TypeScript functions that emit structured visualization steps; they do not depend on React or browser APIs.

## Sorting

### Bubble Sort

**Description.** Bubble Sort repeatedly compares adjacent values and swaps them when they are out of order. Each pass moves the largest remaining value to the end of the unsorted region.

**Pseudocode.**

```text
procedure bubbleSort(A)
  for pass = 0 to n - 2
    swapped = false
    for i = 0 to n - pass - 2
      if A[i] > A[i + 1] then swap(A[i], A[i + 1]); swapped = true
    mark A[n - pass - 1] as sorted
    if not swapped then return
```

**Implementation approach.** The implementation is stable and in-place. It uses an early-exit flag, so already sorted input finishes after one pass.

**Complexity.** Best O(n), average O(n²), worst O(n²), space O(1).

**Edge cases handled.** Empty arrays, one-element arrays, duplicates, sorted arrays, reverse-sorted arrays, and all-equal arrays.

### Merge Sort

**Description.** Merge Sort recursively divides the array into halves, sorts each half, and merges sorted runs back together.

**Pseudocode.**

```text
procedure mergeSort(A, lo, hi)
  if lo >= hi then return
  mid = floor((lo + hi) / 2)
  mergeSort(A, lo, mid)
  mergeSort(A, mid + 1, hi)
  left = A[lo..mid]; right = A[mid+1..hi]
  while both runs non-empty: A[k++] = smaller front element
  copy any remaining elements
  A[lo..hi] is now sorted
```

**Implementation approach.** The implementation is top-down and uses temporary left/right buffers. It is stable because equal values are taken from the left run first. It records comparison-and-overwrite steps during merging.

**Complexity.** Best, average, and worst O(n log n), space O(n).

**Edge cases handled.** Empty arrays, one-element arrays, duplicates, sorted arrays, reverse-sorted arrays, and all-equal arrays.

### Quick Sort

**Description.** Quick Sort partitions an array around a pivot, then recursively sorts the left and right partitions.

**Pseudocode.**

```text
procedure quickSort(A, lo, hi)
  if lo >= hi then return
  p = partition(A, lo, hi)
  quickSort(A, lo, p - 1)
  quickSort(A, p + 1, hi)
procedure partition(A, lo, hi)
  pivot = A[hi]; i = lo
  for j = lo to hi - 1
    if A[j] < pivot then swap(A[i], A[j]); i = i + 1
  swap(A[i], A[hi])
  return i
```

**Implementation approach.** The implementation uses Lomuto partitioning with the last element as pivot and a strict `<` comparison. It is in-place but not stable.

**Complexity.** Best and average O(n log n), worst O(n²). Space is O(log n) on average and O(n) in the worst case due to recursion depth.

**Important assumption.** Because the pivot is always the last element, sorted, reverse-sorted, and all-equal arrays can produce quadratic behavior. A randomized or median-of-three pivot strategy is not implemented.

**Edge cases handled.** Empty arrays, one-element arrays, duplicates, sorted arrays, reverse-sorted arrays, and all-equal arrays.

### Heap Sort

**Description.** Heap Sort builds a binary max-heap in the array, then repeatedly extracts the maximum into the final sorted suffix.

**Pseudocode.**

```text
procedure heapSort(A)
  for i = floor(n/2) - 1 down to 0: siftDown(A, i, n)
  for end = n - 1 down to 1
    swap(A[0], A[end])
    siftDown(A, 0, end)
procedure siftDown(A, root, end)
  compare with left and right children
  if a child is larger: swap and continue down
```

**Implementation approach.** The implementation uses bottom-up heap construction and iterative sift-down. It is in-place but not stable.

**Complexity.** Best, average, and worst O(n log n), space O(1).

**Edge cases handled.** Empty arrays, one-element arrays, duplicates, sorted arrays, reverse-sorted arrays, and all-equal arrays.

## Graph Algorithms

The graph model supports labelled nodes, directed or undirected weighted edges, and validation against self-loops, duplicate edges, negative weights, non-finite weights, and excessive node counts. Adjacency lists process neighbors in label order for deterministic output.

### Breadth-First Search

**Description.** BFS explores a graph in layers from a selected source.

**Pseudocode.**

```text
mark s discovered; queue ← [s]
while queue not empty:
  u ← queue.dequeue()
  mark u visited
  for each neighbor v of u:
    if v undiscovered:
      mark v discovered; queue.enqueue(v)
    else skip v
```

**Implementation approach.** BFS uses a FIFO queue and marks nodes discovered when they are enqueued, so each node enters the queue at most once.

**Complexity.** O(V + E) time, O(V) space.

**Edge cases handled.** Missing source, single-node graphs, disconnected components, cycles, and duplicate-edge prevention.

### Depth-First Search

**Description.** DFS follows one branch as far as possible before backtracking.

**Pseudocode.**

```text
stack ← [s]
while stack not empty:
  u ← stack.pop()
  if u visited: continue
  mark u visited
  for each neighbor v of u (reverse order):
    if v not visited: stack.push(v)
```

**Implementation approach.** DFS is implemented iteratively with an explicit stack, not recursion. Neighbors are pushed in reverse label order so they pop in label order. A node can appear on the stack more than once; stale entries are skipped when popped.

**Complexity.** O(V + E) time. Space is O(V + E) for this push-all-neighbors stack variant.

**Edge cases handled.** Missing source, single-node graphs, disconnected components, cycles, and stale stack entries.

### Dijkstra's Shortest Path

**Description.** Dijkstra computes shortest paths from a source when all edge weights are non-negative.

**Pseudocode.**

```text
dist[*] ← ∞; dist[s] ← 0; heap ← {(0, s)}
while heap not empty:
  (d, u) ← heap.extractMin()
  if u finalized: continue
  finalize u
  for each edge (u, v, w):
    if dist[u] + w < dist[v]:
      dist[v] ← dist[u] + w; prev[v] ← u; heap.insert(v)
reconstruct path by following prev from target
```

**Implementation approach.** The implementation uses a binary min-heap with lazy deletion. It inserts a new heap entry when a better distance is found and skips stale entries later. Negative and non-finite weights are rejected because they invalidate Dijkstra's finalization invariant.

**Complexity.** O((V + E) log V) time and O(V + E) space for the implemented heap strategy.

**Edge cases handled.** Missing source, single-node graph, disconnected graph, unreachable target, cycles, zero-weight edges, invalid weights, and path reconstruction.

## Pathfinding

### A* Search

**Description.** A* finds a shortest path on a grid by expanding the open cell with the lowest f(n) = g(n) + h(n).

**Pseudocode.**

```text
g[start] ← 0; open ← {start}
while open not empty:
  current ← cell in open with lowest f
  if current = target: reconstruct path; stop
  move current to closed
  for each neighbor n (4-dir, unit cost):
    if n in closed: skip
    tentative ← g[current] + 1
    if tentative < g[n]: parent[n] ← current; g[n] ← tentative; add/update n in open
no path
```

**Implementation approach.** The grid is 4-directional with unit-cost movement. Walls are impassable. The open set is a binary min-heap with lazy deletion. Ties prefer lower f, then larger g, then row/column key order for deterministic output.

**Heuristics.** Manhattan distance is exact on an empty 4-neighbor grid and is admissible and consistent. Euclidean distance is also admissible and consistent in this setting, though less directly matched to 4-direction movement.

**Complexity.** Worst-case O(V log V) time and O(V) space, where V is the number of cells. A better heuristic may expand fewer cells in practice but does not change the worst-case bound.

**Edge cases handled.** Adjacent start/target, generated mazes, drawn walls, endpoint placement on cleared cells, no-path situations, and path reconstruction.

## Data Structures

### Binary Search Tree

**Description.** The BST is an ordinary unbalanced binary search tree with unique integer keys.

**Pseudocode.**

```text
insert(node, v): compare and walk left or right until an empty child is found
search(node, v): compare and walk left or right until found or absent
delete(v): locate node z
  if z is a leaf: detach z
  else if z has one child: link parent directly to that child
  else: copy in-order successor into z and remove the successor node
```

**Implementation approach.** Nodes are stored in an id-keyed map so each step can hold an immutable snapshot. Delete handles leaf, one-child, and two-child cases. Two-child deletion uses the in-order successor.

**Complexity.** Search, insert, and delete are O(h), where h is tree height. Average time is O(log n) under a random insertion-order assumption; worst case is O(n) when the tree degenerates into a chain. Space is O(n).

**Edge cases handled.** Empty tree, duplicate insert, search miss, delete miss, root deletion, leaf deletion, one-child deletion, two-child deletion, and sorted-insert chains.

### Stack

**Description.** Stack is a last-in, first-out collection backed by an array.

**Pseudocode.**

```text
push(x): if full, report overflow; otherwise write x at size and increment size
pop(): if empty, report underflow; otherwise read top and decrement size
peek(): if empty, report underflow; otherwise read top without mutation
clear(): size ← 0
```

**Implementation approach.** The top is always `items.length - 1`. Bounded mode uses a fixed capacity; unbounded mode is capped by a visualization limit.

**Complexity.** Push, pop, and peek are O(1). Space is O(n).

**Edge cases handled.** Empty stack, underflow, overflow, clear, custom values, and random data.

### Queue

**Description.** Queue is a first-in, first-out collection backed by a circular buffer.

**Pseudocode.**

```text
enqueue(x): if full, grow or report overflow; write at (head + size) mod capacity
dequeue(): if empty, report underflow; read and clear head; advance head modulo capacity
front(): if empty, report underflow; read head without mutation
clear(): head ← 0; size ← 0
```

**Implementation approach.** Dequeue advances the head pointer instead of shifting items. Bounded mode reports overflow; unbounded mode doubles the buffer when full up to the display limit.

**Complexity.** Dequeue and front are O(1). Bounded enqueue is O(1); growable enqueue is amortized O(1) with occasional O(n) resize. Space is O(n).

**Edge cases handled.** Empty queue, underflow, overflow, circular wrap-around, clear, custom values, and random data.
