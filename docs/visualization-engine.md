# Visualization Engine

AlgoViz uses a step-based visualization engine. Algorithms do not animate directly. They produce structured snapshots, and the UI renders whichever snapshot the playback controller selects.

## Step Generation

Each algorithm engine runs to completion and returns a list of steps. A step contains the data needed to explain and render a moment in the algorithm:

- snapshot of the current array, graph, grid, tree, stack, or queue
- operation type
- active indices, nodes, cells, edges, or items
- cumulative statistics
- explanation text
- active pseudocode line
- visual roles such as current, queued, visited, path, inserted, deleted, or compared

This keeps visualizations tied to real algorithm execution. The UI does not fake traversal order, shortest paths, swaps, or data-structure mutations.

## Playback Controller

`StepController` is a framework-independent state machine. It tracks:

- `currentStep`
- `totalSteps`
- `isPlaying`
- `isPaused`
- speed interval
- elapsed time

It exposes `start`, `pause`, `resume`, `next`, `previous`, `reset`, and `complete`. The React hook `useStepPlayer` subscribes to it and exposes the same state to visualizers.

The controller has tests for:

- reset during playback
- loading new steps during playback
- disposing while timers are active
- changing speed mid-run
- rapid play/pause toggling
- stopping exactly on the final step

## Synchronization Between Algorithm and UI

The app uses precomputed steps instead of mutating live algorithm state during animation. That gives several benefits:

- previous-step navigation is exact
- the same input produces the same trace for deterministic algorithms
- the final visualization state can be tested against the algorithm result
- user input changes reset playback cleanly
- speed changes affect only timing, not algorithm execution

## Rendering by Area

- **Sorting:** DOM bars show comparisons, swaps, pivots, overwritten values, sorted regions, and final order.
- **Graphs:** SVG nodes and edges show frontier state, current node, visited/finalized nodes, relaxed edges, and reconstructed paths.
- **A*:** SVG grid cells show walls, open set, closed set, current cell, inspected neighbor, start, target, and final path.
- **BST:** SVG tree layout shows comparisons, path taken, inserted nodes, deleted nodes, successor nodes, replacement, and root.
- **Stack and Queue:** HTML lists show logical order, top/front/rear markers, pushed/enqueued items, removed items, peeked values, empty states, and buffer slots.

## Statistics

`src/algorithms/core/stats.ts` defines shared statistic identifiers. Each algorithm declares the statistics it actually supports. The UI renders only those identifiers, so a sorting-only counter such as swaps does not appear on A*, and a pathfinding-only counter such as path length does not appear on stack operations.

Examples include:

- step position
- comparisons
- swaps
- array accesses
- visited or finalized nodes
- edge checks
- frontier operations
- queue and stack operations
- tree comparisons
- size and capacity
- path length
- nodes explored
- elapsed playback time
- compute time for trace generation

## Reduced Motion

When the user's system requests reduced motion, CSS transitions are minimized and visualizers that set default speed choose a slower playback mode. The current state remains available through text explanations, pseudocode highlighting, statistics, legends, and result summaries.

## Browser Cost vs Algorithm Cost

The visualization engine records and renders educational traces. This is separate from the theoretical complexity of the algorithm itself. For example, a sort may be O(n log n), while rendering every recorded overwrite and comparison also has a browser cost. AlgoViz uses input limits so traces remain understandable and responsive.
