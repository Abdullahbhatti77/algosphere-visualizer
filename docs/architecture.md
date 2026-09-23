# Architecture

## Layers

```text
src/algorithms/          pure TypeScript, no React
  core/                  step controller, statistics, complexity catalog
  sorting/               bubble, merge, quick, heap + recorder
  graph/                 types, graph model/editor validation, bfs, dfs, dijkstra
  pathfinding/           grid model, heuristics, A*
  data-structures/       bst, stack, queue
src/components/          visualizers (SVG / DOM) consuming steps
src/routes/              pages
```

The rule: nothing in `src/algorithms` imports React or touches the DOM. That
makes every engine testable in Node and reusable elsewhere.

## Data flow

1. The UI collects input (array, graph, grid, operation).
2. The engine runs to completion and returns an immutable list of steps, each a
   full snapshot plus an explanation, pseudocode line and statistics.
3. `StepController` owns playback: the current index, playing/paused state and
   speed. It uses an injectable scheduler, so it runs in tests without timers.
4. A thin React adapter subscribes to the controller and renders the current
   step.

## Why precompute steps?

Inputs are bounded (see README), so recording is cheap and gives
deterministic playback, backward stepping and exact step counts. The final
step is checked in tests against the algorithm's returned result.

## Registry and catalog

`src/algorithms/core/catalog.ts` holds typed metadata for every algorithm:
name, category, complexity (with assumptions), pseudocode and documentation.
Panels render from this single source.
