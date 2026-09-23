# AlgoViz — Interactive Algorithm Visualizer

**Interactive visualization of algorithms and data structures with step-by-step execution, live complexity information, and real-time algorithm statistics.**

![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-tests-6e9f18?logo=vitest&logoColor=white)

## Project Overview

AlgoViz is an interactive Computer Science visualization project for observing how algorithms behave between input and output. Instead of showing only a final sorted array, traversal order, shortest path, or data-structure state, the application records intermediate state transitions from real TypeScript implementations and renders those steps in the browser.

The project was built to make algorithm execution easier to inspect: comparisons, swaps, queue and stack updates, distance relaxations, path reconstruction, and tree operations are shown as data produced by the algorithms themselves.

## Motivation

Traditional algorithm learning often focuses on source code, pseudocode, and asymptotic notation. Those are essential, but they can hide the moment-by-moment behavior that determines why an algorithm works and why certain inputs are expensive.

AlgoViz complements that material by visualizing:

- comparisons and swaps in sorting algorithms
- traversal states in BFS and DFS
- queue, stack, and heap/frontier changes
- tentative distance updates in Dijkstra's algorithm
- path reconstruction in A*
- insertion, search, and deletion cases in an ordinary binary search tree
- underflow, overflow, and pointer movement in stack and queue operations

The result is a software-engineering and educational visualization project rather than a benchmark suite or a research claim.

## Features

### Sorting

- Bubble Sort
- Merge Sort
- Quick Sort
- Heap Sort

### Graph Algorithms

- Breadth-First Search (BFS)
- Depth-First Search (DFS), implemented with an explicit stack
- Dijkstra's Shortest Path, implemented with a binary min-heap and lazy deletion
- Interactive SVG graph editor
- Directed and undirected edges
- Edge weights with validation against negative and non-finite values

### Pathfinding

- A* pathfinding on a 4-directional, unit-cost grid
- Manhattan and Euclidean heuristic options
- Wall drawing and erasing
- Start and target placement
- Random maze generation
- No-path explanations when the target is unreachable

### Data Structures

- Binary Search Tree, intentionally unbalanced
- Stack, array-backed with bounded and visual-limit behavior
- Queue, circular-buffer based with bounded and growable modes

### Visualization

- Step-by-step execution
- Play, pause, previous step, next step, restart, skip-to-end, and speed control
- Live operation statistics for only the counters each algorithm actually tracks
- Complexity information tied to the implementation assumptions
- Pseudocode highlighting for the current step
- Text explanations for each algorithm state transition

### Accessibility

Implemented accessibility features include keyboard-operable controls, visible focus states, accessible labels on controls and SVG regions, reduced-motion support, text summaries of important algorithm states, and non-color visual indicators such as marks, patterns, outlines, dashes, and labels.

### Responsive Design

The interface is designed for desktop and mobile use. Controls stack on smaller screens, visualizers scale to the viewport, graph nodes and labels are enlarged on narrow screens, and scroll/pan affordances are used where a structure such as a tree can be wider than the viewport.

## Live Demo

Live demo: coming soon.

## Screenshots

Screenshots should be captured from the running application and saved under `screenshots/` before publishing a final portfolio README. The intended filenames are:

```text
screenshots/
├── dashboard.png
├── sorting.png
├── graph-editor.png
├── dijkstra.png
├── astar.png
├── bst.png
├── stack-queue.png
└── complexity-panel.png
```

No screenshots are embedded here until real captures are added.

## Architecture

```text
User Interaction
↓
React UI
↓
Algorithm Controller
↓
Step Generator
↓
Algorithm Implementation
↓
State / Statistics
↓
Visualization
```

The important design boundary is that algorithm logic is intentionally separated from the presentation layer. Files under `src/algorithms/` are framework-independent TypeScript modules. They do not import React and do not manipulate the DOM.

Each algorithm produces structured state transitions. The React visualizers consume those transitions and render the current step. This makes the animation traceable: the UI is a view over algorithm state, not a separate scripted animation.

## Engineering Design

AlgoViz is structured around a small set of reusable engineering ideas:

- **Algorithm/UI separation** — sorting, graph, pathfinding, and data-structure logic lives outside React.
- **Step-based execution** — algorithms run to completion, record immutable snapshots, and expose explanations, pseudocode line numbers, and statistics.
- **Animation controller** — a framework-agnostic `StepController` owns playback state: current step, play/pause, speed, previous/next, reset, completion, and elapsed time.
- **Shared statistics system** — each algorithm declares which statistics are meaningful; unsupported counters are not shown as fake zeros.
- **Complexity metadata** — algorithm definitions include complexity values and assumptions that can be rendered consistently.
- **Reusable visualization components** — shared panels render playback controls, pseudocode, statistics, complexity, and algorithm documentation.
- **Typed algorithm definitions** — catalog entries describe category, display name, implementation, pseudocode, complexity, documentation, visualizer type, and supported statistics.
- **Deterministic state transitions** — graph traversals use label ordering, seeded generators are used where appropriate, and tests assert repeatable outcomes.

## Algorithm Documentation Summary

Detailed implementation notes are available in [`docs/algorithms.md`](docs/algorithms.md). The summary below documents the algorithms currently implemented.

### Bubble Sort

- **Description:** Adjacent comparison sort that repeatedly bubbles the largest remaining value to the end of the unsorted region.
- **How it works:** Compare neighboring elements, swap out-of-order pairs, shrink the unsorted region, and stop early if a pass performs no swaps.
- **Implementation details:** Stable, in-place, and includes an early-exit flag.
- **Pseudocode:** See `src/algorithms/sorting/bubble.ts` and `docs/algorithms.md`.
- **Time:** best O(n), average/worst O(n²).
- **Space:** O(1).
- **Edge cases handled:** empty input, single value, duplicates, already sorted input, reverse-sorted input, and all-equal input.

### Merge Sort

- **Description:** Divide-and-conquer comparison sort that recursively sorts halves and merges them.
- **How it works:** Split the range, sort each half, then merge temporary left/right runs back into the working array.
- **Implementation details:** Stable because ties take from the left run first; not in-place because it uses auxiliary buffers.
- **Time:** O(n log n) in best, average, and worst cases.
- **Space:** O(n) auxiliary buffer plus recursion stack.
- **Edge cases handled:** empty input, single value, duplicates, sorted and reverse-sorted arrays.

### Quick Sort

- **Description:** In-place partitioning sort.
- **How it works:** Select the last element as pivot, partition with the Lomuto scheme, then recurse on both sides.
- **Implementation details:** Uses strict `<`, so duplicate-heavy and all-equal inputs can produce unbalanced partitions. Not stable.
- **Time:** best/average O(n log n), worst O(n²).
- **Space:** O(log n) average recursion stack, O(n) worst recursion stack.
- **Edge cases handled:** empty input, single value, duplicates, sorted input, reverse-sorted input, and all-equal input.

### Heap Sort

- **Description:** In-place comparison sort using a binary max-heap.
- **How it works:** Build a max-heap bottom-up, repeatedly swap the root with the end of the heap region, then sift down.
- **Implementation details:** Iterative sift-down; not stable.
- **Time:** O(n log n) in best, average, and worst cases.
- **Space:** O(1).
- **Edge cases handled:** empty input, single value, duplicates, sorted and reverse-sorted arrays.

### Breadth-First Search

- **Description:** Graph traversal that explores nodes in increasing edge distance from the source.
- **How it works:** Mark the source discovered, enqueue it, repeatedly dequeue a node, and enqueue undiscovered neighbors.
- **Implementation details:** Uses a FIFO queue. Neighbors are processed in label order for deterministic traversal.
- **Time:** O(V + E).
- **Space:** O(V).
- **Edge cases handled:** missing source, single-node graph, disconnected graph, cyclic graph, and duplicate-edge prevention in the editor.

### Depth-First Search

- **Description:** Graph traversal that explores one branch deeply before backtracking.
- **How it works:** Push the source, pop a node, visit it if it is not stale, and push unvisited neighbors.
- **Implementation details:** Uses an explicit stack rather than recursion. Neighbors are pushed in reverse label order so they pop in label order.
- **Time:** O(V + E).
- **Space:** O(V + E) for this push-all-neighbors stack variant.
- **Edge cases handled:** missing source, single-node graph, disconnected graph, cyclic graph, and stale stack entries.

### Dijkstra's Shortest Path

- **Description:** Single-source shortest-path algorithm for graphs with non-negative edge weights.
- **How it works:** Repeatedly finalize the unfinalized node with the smallest tentative distance, relax outgoing edges, and reconstruct the target path through predecessor links.
- **Implementation details:** Uses a binary min-heap with lazy deletion instead of decrease-key. Negative and non-finite weights are rejected.
- **Time:** O((V + E) log V).
- **Space:** O(V + E).
- **Edge cases handled:** unreachable targets, disconnected graphs, cyclic graphs, zero-weight edges, and invalid weights.

### A* Search

- **Description:** Best-first pathfinding that orders open cells by f(n) = g(n) + h(n).
- **How it works:** Expand the open cell with the lowest f score, update neighbors when a better g score is found, and reconstruct the path from parent links once the target is reached.
- **Implementation details:** 4-directional grid, unit movement cost, binary min-heap with lazy deletion, Manhattan and Euclidean heuristics.
- **Time:** O(V log V) worst case for V grid cells under the implemented grid assumptions.
- **Space:** O(V).
- **Edge cases handled:** adjacent start/target, generated mazes, start/target placement, walls, and no-path cases.

### Binary Search Tree

- **Description:** Ordinary unbalanced BST with unique integer keys.
- **How it works:** Search, insert, and delete each follow one root-to-node path. Delete handles leaf, one-child, and two-child cases.
- **Implementation details:** Two-child deletion uses the in-order successor. No AVL or red-black rebalancing is performed.
- **Time:** best O(1), average O(log n), worst O(n) for search/insert/delete.
- **Space:** O(n).
- **Edge cases handled:** empty tree, duplicate insert, search miss, root deletion, leaf deletion, one-child deletion, two-child deletion, and degenerate chains.

### Stack

- **Description:** Last-in, first-out structure backed by an array.
- **How it works:** Push writes at the top, pop removes from the top, and peek reads the top without mutation.
- **Implementation details:** Bounded mode has fixed capacity; unbounded mode is still capped for visualization legibility.
- **Time:** O(1) for push, pop, and peek in the implemented bounded visualization.
- **Space:** O(n).
- **Edge cases handled:** underflow, overflow, clear, random fill, and custom values.

### Queue

- **Description:** First-in, first-out structure backed by a circular buffer.
- **How it works:** Enqueue writes at the rear slot, dequeue reads and clears the head slot, and front reads without mutation.
- **Implementation details:** Bounded mode reports overflow; unbounded mode doubles the buffer when full, making enqueue amortized O(1).
- **Time:** O(1) for bounded enqueue/dequeue/front; unbounded enqueue is amortized O(1) with occasional O(n) resize.
- **Space:** O(n).
- **Edge cases handled:** underflow, overflow, wrap-around, clear, random fill, and custom values.

## Complexity Table

| Algorithm | Best Time | Average Time | Worst Time | Space | Notes |
| --- | --- | --- | --- | --- | --- |
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Best case depends on the implemented early-exit flag. |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Uses auxiliary left/right buffers. |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) avg, O(n) worst | Lomuto partition with last-element pivot; sorted, reverse-sorted, and all-equal inputs are worst cases. |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | In-place binary max-heap with iterative sift-down. |
| BFS | O(V + E) | O(V + E) | O(V + E) | O(V) | Adjacency-list traversal, source-reachable component only. |
| DFS | O(V + E) | O(V + E) | O(V + E) | O(V + E) | Explicit stack may hold duplicate stale entries. |
| Dijkstra | O((V + E) log V) | O((V + E) log V) | O((V + E) log V) | O(V + E) | Binary min-heap with lazy deletion; requires non-negative weights. |
| A* | O(V log V) | O(V log V) | O(V log V) | O(V) | 4-directional unit-cost grid; heuristic affects explored cells but not this worst-case bound. |
| Binary Search Tree | O(1) | O(log n) | O(n) | O(n) | Ordinary unbalanced BST; sorted inserts can degrade to a chain. |
| Stack | O(1) | O(1) | O(1) | O(n) | Array-backed bounded educational visualization. |
| Queue | O(1) | O(1) amortized | O(1) bounded / O(n) resize | O(n) | Circular buffer; unbounded mode may resize. |

## Testing

The test suite focuses on correctness of the algorithm engines and the shared execution model. It covers:

- sorting edge cases: empty arrays, single values, duplicates, sorted input, reverse-sorted input, all-equal input, and seeded random arrays
- graph traversal correctness for BFS and DFS
- Dijkstra shortest paths against a reference distance implementation
- A* pathfinding, no-path cases, heuristic behavior, and generated mazes
- BST insertion, deletion, search, duplicates, root deletion, and invariant preservation
- stack and queue operations against array-based reference models
- step generation integrity
- statistics formatting and supported-stat filtering
- complexity metadata completeness
- playback controller race conditions, reset behavior, completion, and speed changes

Run tests with:

```bash
npm run test
```

No coverage percentage is claimed because this repository does not currently publish a measured coverage report.

## Accessibility

AlgoViz includes practical accessibility features but does not claim formal WCAG certification.

Implemented behavior includes:

- keyboard-operable buttons, tabs, selects, sliders, and form inputs
- visible focus outlines
- skip-to-content link
- accessible labels on playback and editing controls
- text descriptions of current algorithm steps through live regions
- text result summaries for completed visualizations
- visual states represented by labels, marks, outlines, dashes, or patterns in addition to color
- reduced-motion support that removes transitions and slows default playback where applicable

See [`docs/accessibility.md`](docs/accessibility.md) for details.

## Responsive Design

The application is designed to remain usable across mobile, tablet, and desktop sizes:

- controls wrap or stack on smaller screens
- visualizer regions scale to available width
- graph nodes and labels enlarge on narrow screens
- the BST canvas can be panned and zoomed
- side panels move below the main visualization when space is limited
- horizontal overflow is avoided in the main app layout

## Limitations

Academic and engineering credibility requires being clear about scope:

- AlgoViz is an educational visualization project, not a performance benchmark suite.
- Very large inputs can reduce animation smoothness because each meaningful transition is recorded and rendered.
- Input limits exist to keep visualizations readable: arrays up to 60 values, graphs up to 26 nodes, BSTs up to 31 nodes, and stack/queue displays up to 16 items.
- The BST is intentionally unbalanced and can degrade to O(n) height.
- The graph editor is designed for small interactive learning graphs, not large-scale graph analysis.
- A* behavior depends on heuristic choice and grid structure.
- Browser rendering performance affects how smoothly long traces animate.

## Future Work

The following ideas are not implemented yet:

- AVL Tree
- Red-Black Tree
- Bellman-Ford
- Floyd-Warshall
- Prim's Algorithm
- Kruskal's Algorithm
- Dynamic Programming visualizations
- Union-Find / Disjoint Set Union
- Trie
- advanced graph layouts
- exportable algorithm execution traces
- optional benchmarking mode with measured methodology

## Local Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd algoviz
npm install
npm run dev
```

The repository does not currently define an `engines` field. Use an actively supported Node.js LTS release compatible with the installed Vite/TanStack tooling.

Useful commands:

```bash
npm run dev       # start the local development server
npm run build     # create a production build
npm run preview   # preview the production build locally
npm run test      # run the Vitest suite
npm run lint      # run ESLint
npm run format    # format the repository with Prettier
```

The project also includes `bun.lock`, so Bun can be used by contributors who prefer it:

```bash
bun install
bun run dev
bun run test
```

## Academic Context

This project was developed as an independent Computer Science software-engineering project to explore algorithm implementation, state-driven visualization, complexity analysis, and interactive learning interfaces.

Its contribution is primarily engineering and educational visualization: implementing algorithms carefully, recording their intermediate states, presenting accurate complexity assumptions, and building an interface where users can experiment with inputs and inspect behavior.

## Why I Built This

I built AlgoViz to strengthen my understanding of algorithms and data structures by making their internal state observable. The project let me connect theoretical complexity with concrete execution traces, while applying software-engineering principles such as modular design, typed interfaces, reusable components, validation, testing, and documentation to a Computer Science learning tool.

## License

This project is licensed under the [MIT License](LICENSE).
