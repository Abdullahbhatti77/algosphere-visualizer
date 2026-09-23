# Development

This guide documents the conventions used in AlgoViz so another developer can extend the project coherently.

## Local Setup

```bash
git clone <repository-url>
cd algoviz
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run test
npm run lint
npm run format
```

The repository includes `bun.lock`, so Bun can also be used:

```bash
bun install
bun run test
```

## Conventions

- Keep algorithm engines under `src/algorithms/` free of React and DOM imports.
- Emit structured steps from algorithms rather than manipulating the UI directly.
- Keep complexity claims tied to the exact implementation.
- Add tests for edge cases and reference-model correctness before documenting a feature as complete.
- Display only statistics that the algorithm genuinely tracks.
- Keep visual states understandable without color alone.

## Adding a New Algorithm

A new algorithm should follow this sequence:

1. **Implement the engine** in the appropriate `src/algorithms/` subfolder.
2. **Define a step shape** if the existing step types are not sufficient.
3. **Emit snapshots** for each meaningful state transition.
4. **Track statistics** that are meaningful for that algorithm.
5. **Add metadata** to `src/algorithms/core/catalog.ts` or the relevant registry.
6. **Add pseudocode** and implementation assumptions.
7. **Create or reuse a visualizer** that consumes the step snapshots.
8. **Add tests** for correctness, edge cases, and step integrity.
9. **Update documentation** in `docs/algorithms.md` and `docs/complexity.md`.

## Adding a Sorting Algorithm

Sorting algorithms use the shared `AlgorithmDefinition` shape from `src/algorithms/types.ts` and usually emit `AlgorithmStep` records through `StepRecorder`.

Expected metadata includes:

- `id`
- `name`
- `category: "sorting"`
- `tagline`
- overview and practical notes
- pseudocode
- best/average/worst/space complexity
- `stable`
- `inPlace`
- `generate(input)`

## Adding a Graph Algorithm

Graph algorithms use the graph model and `GraphRecorder`. They should accept a graph plus source/target options and emit graph steps with node states, edge states, frontier contents, traversal order, metrics, and explanation text.

A graph algorithm should define:

- pseudocode
- display name and tagline
- whether it uses weights
- whether it uses a target
- accurate complexity notes based on its data structures

## Adding a Pathfinding Algorithm

Pathfinding algorithms should use the grid model in `src/algorithms/pathfinding/`. They should record open/closed/current/path state, score data when relevant, and explicit no-path termination.

If a heuristic is used, document:

- whether it is admissible
- whether it is consistent under the implemented movement model
- how it affects practical search behavior
- what it does not guarantee

## Adding a Data Structure

Data-structure operations should return a `DSOperationResult` containing:

- operation name
- pseudocode
- steps
- final state
- status
- optional returned value

Each step should include:

- state snapshot
- visual roles
- explanation
- pseudocode line
- operation status
- primitive work count

## Adding Tests

Tests should cover both final results and intermediate traces where possible. For a new algorithm, include:

- minimal input
- typical input
- duplicate or repeated values when relevant
- invalid input
- disconnected or unreachable cases for graph/pathfinding work
- reference-model comparison when practical
- statistics counter expectations
- metadata completeness

## Documentation Checklist

Before considering a new algorithm complete, update:

- README feature list if it is user-facing
- `docs/algorithms.md`
- `docs/complexity.md`
- tests for metadata completeness
- screenshots if the visual page changes meaningfully
