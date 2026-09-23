# Architecture

AlgoViz is organized around a clear boundary between algorithm execution and presentation. The visualization layer does not invent animation states; it renders state transitions produced by framework-independent algorithm modules.

## Project Structure

```text
src/
├── algorithms/
│   ├── core/              # StepController, statistics, complexity/catalog metadata
│   ├── sorting/           # Bubble, merge, quick, heap sort engines
│   ├── graph/             # Graph model, editor validation, BFS, DFS, Dijkstra
│   ├── pathfinding/       # Grid model, heuristics, A* search
│   └── data-structures/   # BST, stack, queue engines
├── components/
│   ├── viz/               # Shared panels and playback controls
│   ├── sorting/           # Sorting visualizer
│   ├── graph/             # Graph editor and graph visualizer
│   ├── pathfinding/       # A* grid visualizer
│   └── data-structures/   # BST, stack, queue visualizers
├── hooks/                 # React adapters for playback, theme, reduced motion
└── routes/                # TanStack Router pages
```

Tests are colocated with the engine code under `src/algorithms/` because the most important correctness checks target pure TypeScript modules.

## Module Boundaries

The main engineering rule is:

```text
src/algorithms  →  no React imports, no DOM access
src/components  →  render existing steps; do not implement algorithm logic
src/routes      →  assemble pages and route metadata
```

This separation keeps the algorithms testable without a browser and makes the UI a consumer of algorithm state rather than a source of truth.

## Data Flow

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

A typical interaction follows this sequence:

1. The user changes input, selects an algorithm, edits a graph, draws a grid, or runs a data-structure operation.
2. A pure algorithm function runs against that input.
3. The function emits a list of structured steps.
4. The playback controller owns the current step index and timing.
5. Shared panels render explanation text, pseudocode, statistics, and complexity metadata.
6. The visualizer renders the current snapshot.

## Step-Based Execution

AlgoViz precomputes visual traces because the project has explicit educational input limits. A step generally contains:

- a full snapshot of the current state
- the operation type
- affected indices, nodes, cells, or items
- a human-readable explanation
- a pseudocode line number
- cumulative metrics

This makes pause, previous step, next step, reset, and skip-to-end exact. The UI does not need to replay mutations to move backward.

## Animation Architecture

`src/algorithms/core/step-controller.ts` implements the framework-independent playback state machine. It exposes:

- current step
- total steps
- playing, paused, idle, and complete states
- speed interval
- elapsed time
- `start`, `pause`, `resume`, `next`, `previous`, `reset`, and `complete`

The React hook in `src/hooks/use-step-player.ts` adapts the controller to React with `useSyncExternalStore`. The controller accepts an injectable scheduler, which lets tests verify race conditions without real timers.

## Algorithm Registry and Metadata

`src/algorithms/core/catalog.ts` is the shared catalogue for documentation and UI panels. Entries include:

- stable identifier
- category
- display name and description
- implementation function reference
- pseudocode
- complexity metadata
- documentation sections
- supported statistics
- visualizer key

This lets the app render consistent documentation, complexity cards, and statistics without hardcoding every panel separately.

## Visualization Technologies

- Sorting uses DOM/CSS bars.
- Graph algorithms use SVG nodes and edges.
- BST uses SVG for parent/child structure.
- A* uses an SVG grid with keyboard and pointer interaction.
- Stack and queue use semantic HTML lists styled as data-structure views.

## Why the App Uses Input Limits

The algorithms could be run on larger inputs, but AlgoViz records every meaningful state transition. Large traces are less useful educationally and can slow browser rendering. The current limits keep the experience readable and interactive:

- arrays: 60 values
- graphs: 26 nodes
- BST: 31 nodes
- stack/queue: 16 displayed items
