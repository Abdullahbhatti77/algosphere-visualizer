# Testing

Run all tests:

```bash
bunx vitest run
```

## Coverage areas

- **Sorting** — empty, single, duplicates, sorted, reverse, all-equal and random inputs compared with `Array.prototype.sort`; final step equals result; counters match recorded events.
- **Graphs** — BFS/DFS order on cyclic and disconnected graphs, Dijkstra against a brute-force reference, unreachable targets, negative/invalid weights, duplicate edges and self-loops rejected.
- **A\*** — optimal path length versus BFS on grids, no-path cases, start equals target, heuristic values.
- **BST** — insertion order, search hit/miss, deletion of leaf / one child / two children / root, duplicates, in-order invariant after random operations.
- **Stack / Queue** — LIFO/FIFO against reference arrays, underflow, overflow, circular wrap-around.
- **StepController** — play/pause/next/previous/reset/complete, speed changes mid-play, no ticks after reset.
- **Metadata** — every catalog entry has complexity, pseudocode and documentation.

Browser checks (Playwright) were run manually at 320, 375, 390, 768, 1024 and
1440 px for overflow and runtime errors; they are not part of the automated
suite.
