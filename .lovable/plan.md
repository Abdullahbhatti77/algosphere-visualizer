# AlgoViz Production Audit

The goal is to harden what already exists, not rebuild it. The visual direction stays the same. Each area below is: audit, fix what is actually broken, then add tests so it stays fixed.

## 1. Algorithm correctness

I'll review each engine and add an edge-case test matrix covering all 11 algorithms and data structures.

- **Sorting (Bubble, Merge, Quick, Heap):** test empty, single-element, duplicate, all-equal, already-sorted and reverse-sorted input. Each must give the same result as a built-in reference sort.
- **Step integrity:**
  - The final step's array equals the returned result.
  - Comparison and swap counters only ever go up.
  - Replaying the swap and write steps from the input rebuilds every snapshot. This catches skipped or duplicated steps.
- **Graphs (BFS, DFS, Dijkstra):** test empty graphs, a single node, disconnected graphs, cycles, self-loops (rejected), duplicate edges (rejected) and unreachable targets.
  - Dijkstra is checked against a brute-force shortest-path reference on seeded random graphs.
  - Every step's visited set may only grow.
- **Pathfinding (A\*):** test start equal to target, a fully walled grid and a sealed-off target. Path length is checked against a BFS reference on seeded mazes, for both heuristics.
- **Data structures:**
  - BST: delete the root in each of the three cases, handle a chain-shaped tree, delete from an empty tree, and run random insert/delete sequences checked against a sorted-set model.
  - Stack and queue: underflow, overflow, and a long random operation sequence checked against a plain-array model, including queue wrap-around and growth.
- Any defect the tests find gets fixed in the engine and listed in the final report.

## 2. Step and animation audit

- **Race conditions:** the step controller gets guards so no timer can fire after reset, load, dispose or reaching the end.
- **Speed changes mid-run:** the pending step is rescheduled at the new speed, without skipping or doubling a step.
- **Tests with a fake clock:** reset while playing, changing speed while playing, pause and resume, loading a new list while playing, and rapid toggling.
- **Stale state:** check every page for leftover selection or roles when the algorithm, input or grid changes, and that the step counter and totals match.
- **Honest labels:** make sure each statistic shows what the step actually recorded, for example comparisons versus accesses in merge sort, and edge checks in undirected graphs.

## 3. Complexity audit

I'll re-check every catalogue entry against its implementation and correct any mismatch.

- **Sorting:**
  - Bubble Sort with early exit is O(n) best.
  - Merge Sort is O(n) extra space, top-down.
  - Quick Sort is Lomuto with the last element as pivot, with O(log n) average and O(n) worst stack space.
  - Heap Sort is O(1) extra space and unstable.
- **Graphs:** DFS keeps O(V + E) space, because this variant pushes every neighbour onto its stack.
- **Dijkstra:** O((V + E) log V) with the binary heap and lazy deletion.
- **A\*:** documented as a bound specific to this grid.
- Assumptions are stated wherever a bound depends on implementation choices.

## 4. Algorithm documentation

Each algorithm gets the same structured sections:

- Overview
- How it works
- When it is useful
- Pseudocode
- Time and space complexity
- Stability and in-place behaviour
- Implementation assumptions

These live in the catalogue and render through one shared panel on every page. Missing sections, such as "When it is useful" for graphs and data structures, get written. A test fails if any entry leaves a section empty.

## 5. About page

I'll rewrite it around "Why AlgoViz exists": making algorithm behaviour observable instead of treating algorithms as black boxes. It will cover:

- Algorithm visualization
- Step-based execution
- Complexity awareness
- Interactive experimentation
- Correctness
- An architecture diagram
- Accessibility commitments
- An honest "what this is not" section: no benchmarks, no research claims

## 6. Mobile and responsive

I'll run Playwright checks at 320, 375, 390, 768, 1024 and 1440px wide on every page and tab. Each check covers:

- Nothing scrolls sideways
- Touch targets of at least 40px
- Text no smaller than 11px
- Charts and trees not clipped
- The menu and dropdowns work

Fixes found at 320px, such as the playback bar and stat grid wrapping, the graph editor toolbar, BST zoom defaults, and the A\* grid size on narrow screens, get applied.

## 7. Accessibility

- **Keyboard:** a full keyboard pass on each page, with visible focus everywhere, including SVG nodes and grid cells.
- **Labels:** every icon button gets a label and a tooltip.
- **Structure:** headings in the right order, and landmarks on each page.
- **Contrast:** I'll check that the chart colours read clearly against the background in both light and dark themes.
- **Reduced motion:** the tree and bars jump without movement, playback defaults to a slower speed, and a text "state summary" is always shown.
- **Final summaries:** each page gets a text summary of the outcome. Examples: "Sorted in 45 comparisons", "Path A→C→B, cost 13", "No path: target enclosed".

## 8. Performance

- Memoise heavy parts of the display, such as the bars, graph canvas, grid cells and tree nodes, so a single step doesn't redraw everything.
- Keep the precomputed step lists; add a step-count guard and state the input limits in the UI.
  - Sorting: up to 60 values.
  - Graphs: up to 26 nodes.
  - Grid: up to 19×35.
  - BST: up to 31 nodes.
  - Stack and queue: up to 16 items.
- Stop derived values being recalculated on every clock tick.

## 9. Error handling

I'll audit every input path so none fails silently. This covers:

- Custom arrays that are empty, contain text, are too long or out of range
- Graph weights that are negative, NaN or empty
- Impossible operations: running Dijkstra with no target, an empty graph, popping an empty stack, or deleting a missing tree node
- No-path cases

Each one gets inline field messages and a status alert.

## 10. Testing

Test files will live next to each engine, plus one each for the step controller and statistics. On top of what is already there, they add:

- Pure graph-editor functions: adding and removing nodes and edges, validation, and toggling directed mode.
- The statistics formatter, including how it shows missing values.
- Speed and reset race conditions in the step controller.
- Where practical, render tests for key display parts, if the test tooling can render components without a browser. Otherwise the Playwright checks cover them.

## 11. GitHub documentation

- `README.md` is rewritten with these sections:
  - Overview and Motivation
  - Features and Supported Algorithms
  - Architecture, with the diagram Algorithm → Step Generator → Animation Controller → Visualization State → React UI
  - Technology Stack: only what is actually used, meaning TanStack Start, React 19, TypeScript, Vite, Tailwind v4, shadcn/Radix, Lucide and Vitest
  - Design Principles and Testing
  - Complexity
  - Future Work, clearly marked as not implemented
  - Screenshot placeholders, under `docs/screenshots/`
  - License
- New files in `docs/`: `architecture.md`, `algorithms.md`, `visualization-engine.md`, `complexity.md` and `testing.md`.
- An MIT `LICENSE` file, using your name, Muhammad Abdullah, and the year 2026.

## 12. Final UI polish

A consistency pass on:

- Spacing and card headers
- Button variants and grouping
- Tooltips on icon buttons
- Empty states: empty graph, empty tree, empty grid path
- Consistent page headers and footers

There is no redesign.

## Verification

- A typecheck and the full Vitest run.
- Playwright checks at all six widths on every page, with a screenshot review.
- A short audit report of the bugs found and fixed.
