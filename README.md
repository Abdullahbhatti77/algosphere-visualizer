# AlgoViz

An interactive visualizer that makes algorithm behaviour observable. Every frame
on screen is a recorded state transition produced by a real implementation of
the algorithm — nothing is pre-scripted.

![Sorting screenshot](docs/screenshots/sorting.png)
![Graph screenshot](docs/screenshots/graph.png)
![Pathfinding screenshot](docs/screenshots/pathfinding.png)
![Data structures screenshot](docs/screenshots/data-structures.png)

> Screenshots are placeholders — capture them from a running build and save
> them under `docs/screenshots/`.

## Motivation

Algorithms are usually taught as pseudocode plus a complexity bound. AlgoViz
treats them as programs you can step through: you see each comparison, each
queue operation and each distance relaxation, alongside the pseudocode line,
the data-structure state and the statistics the implementation actually
counted.

## Supported algorithms

| Area | Algorithms |
| --- | --- |
| Sorting | Bubble Sort, Merge Sort (top-down), Quick Sort (Lomuto), Heap Sort |
| Graphs | BFS, DFS (explicit stack), Dijkstra (binary heap, lazy deletion) |
| Pathfinding | A* on a 4-connected grid (Manhattan / Euclidean heuristics) |
| Data structures | Binary Search Tree (unbalanced), Stack (array-backed), Queue (circular buffer) |

## Architecture

```text
input -> algorithm engine -> AlgorithmStep[] -> StepController -> React view
         (pure TS, no React)  (immutable)      (framework-free)   (SVG / DOM)
```

- `src/algorithms/` — engines, step types, statistics, complexity catalog. No React imports.
- `src/algorithms/core/step-controller.ts` — playback state machine (play, pause, next, previous, reset, complete, speed).
- `src/components/` — visualizers that only read steps.
- `src/routes/` — TanStack Router pages: `/`, `/sort`, `/graph`, `/pathfinding`, `/data-structures`, `/about`.

See [docs/architecture.md](docs/architecture.md).

## Technologies

React 19, TanStack Start / Router, TypeScript (strict), Vite, Tailwind CSS v4,
shadcn/ui primitives, SVG rendering, Vitest.

## Design principles

1. Real execution drives every frame.
2. Engines are deterministic and independent of rendering.
3. Only meaningful statistics are shown — no placeholder zeros.
4. Complexity claims match the implementation and state their assumptions.
5. State is never communicated by colour alone; text summaries accompany visuals.
6. Reduced-motion preferences are respected.

## Input limits

Limits keep playback smooth and are shown in the UI: arrays up to 60 values,
graphs up to 26 nodes, BST up to 31 nodes, stack/queue up to 16 items.

## Development

```bash
bun install
bun run dev
bunx vitest run
```

## Testing

Unit and audit tests cover algorithm correctness, edge cases, step generation,
statistics, complexity metadata, the step controller and graph-editor
validation. See [docs/testing.md](docs/testing.md).

## Complexity

Summarised in [docs/complexity.md](docs/complexity.md); per-algorithm detail in
[docs/algorithms.md](docs/algorithms.md).

## Future work

- Balanced trees (AVL / Red-Black), clearly labelled as such
- Additional sorts (Insertion, Counting, Radix)
- Bellman-Ford for graphs with negative weights
- Diagonal movement for A*
- Exportable step traces

## License

[MIT](LICENSE)
