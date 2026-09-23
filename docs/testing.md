# Testing

AlgoViz tests focus on algorithm correctness, edge cases, step generation, metadata consistency, and playback controller behavior.

## Commands

```bash
npm run test
```

Equivalent Bun command:

```bash
bun run test
```

The repository does not currently publish a coverage percentage, so no coverage number is claimed.

## Test Locations

Tests are colocated with the pure algorithm code:

```text
src/algorithms/sorting/sorting.test.ts
src/algorithms/graph/graph.test.ts
src/algorithms/pathfinding/astar.test.ts
src/algorithms/data-structures/ds.test.ts
src/algorithms/core/step-controller.test.ts
src/algorithms/audit.test.ts
```

## Correctness Strategy

### Sorting

Sorting tests cover:

- empty arrays
- single-element arrays
- duplicate values
- already sorted input
- reverse-sorted input
- all-equal input
- seeded random arrays
- final output against JavaScript's numeric sorted result
- non-mutating behavior for caller input
- step snapshot integrity
- comparison and swap counter consistency

### Graph Algorithms

Graph tests cover:

- BFS traversal order
- DFS traversal order
- cyclic graphs
- disconnected graphs
- single-node graphs
- Dijkstra shortest paths
- Dijkstra unreachable targets
- Dijkstra distances against a reference relaxation implementation
- negative, non-finite, and excessive weights
- duplicate edges and self-loop rejection
- node deletion removing incident edges

### A* Pathfinding

A* tests cover:

- optimal path length compared with BFS-style grid reasoning
- start next to target
- no-path cases
- generated mazes
- heuristic behavior for Manhattan and Euclidean modes
- path reconstruction

### Data Structures

BST tests cover:

- insertion order
- search hit and miss
- duplicate rejection
- leaf deletion
- one-child deletion
- two-child deletion using successor replacement
- root deletion
- degenerate chains
- in-order invariant preservation after random operations

Stack and queue tests cover:

- LIFO and FIFO behavior against reference arrays
- underflow
- overflow
- clear operations
- circular queue wrap-around
- growable queue behavior

### Step Controller and Statistics

Controller and statistics tests cover:

- play, pause, next, previous, reset, and complete
- speed changes while playing
- reset/load/dispose while timers are active
- avoiding duplicate timers after rapid toggles
- missing statistics rendering as a dash instead of fake zeros
- only declared statistics appearing for an algorithm

### Metadata

Audit tests check that every catalog entry includes documentation, pseudocode, complexity metadata, and implementation notes.

## Manual Browser Checks

Manual browser checks have been used for layout and runtime sanity at representative widths including 320, 375, 390, 768, 1024, and 1440 pixels. These checks are not part of the automated suite.

## Future Testing Improvements

Potential future additions:

- Playwright smoke tests committed to the repository
- accessibility checks with automated tooling
- visual regression tests for key screenshots
- coverage reporting after choosing a coverage threshold
- property-based testing for graph and data-structure operations
