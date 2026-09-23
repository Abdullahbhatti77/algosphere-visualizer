# AlgoViz Stage 2 — Graph Algorithms and A* Pathfinding

Sorting module and overall design stay as-is. Graph and Pathfinding pages replace their "Coming soon" panels, reusing the existing header, playback bar, speed levels, stats/explanation/pseudocode/complexity panels, and the step player.

## What users get

**/graph** — interactive graph editor + BFS, DFS, Dijkstra.
- Editor modes (toggle group): Select/Move, Add node, Add edge, Delete. Click empty canvas to add a node, drag to move, click two nodes to create an edge, click node/edge in Delete mode (or press Delete key) to remove it.
- Directed / undirected toggle, weight input for the selected edge, "Sample graph", "Clear graph".
- Source and target pickers (dropdowns, so it is also keyboard/touch friendly without precise tapping).
- Invalid states blocked with inline messages: self-loops, duplicate edges (same pair and direction; in undirected mode A-B equals B-A), non-numeric or negative weights, node cap (26, labels A–Z), running with no source.
- Collapsible interaction guide.
- Side panels: queue (BFS) / stack (DFS) / distance + predecessor table and visited set (Dijkstra), traversal order, step counter, edge traversals.
- DFS uses an explicit stack (iterative), stated in the UI; neighbors pushed in reverse label order so visit order matches the recursive definition.
- Dijkstra uses a binary min-heap with lazy deletion: complexity shown as O((V + E) log V) time, O(V + E) space. Negative weight input is rejected with an explanation (greedy finalization breaks when a later edge could lower a finalized distance).
- Final path highlighted; textual summary ("Shortest path A → C → F, cost 7" / "F is unreachable from A").

**/pathfinding** — A* on a 2D grid.
- Tools: Draw wall, Erase, Set start, Set target; click or drag (pointer events, works on touch). Random maze (seeded recursive-backtracker, with a "new seed" button), Clear grid, Clear path.
- Heuristic select: Manhattan (4-directional movement, admissible and consistent) and Euclidean (still admissible on 4-neighbour grid but less informed; documented). Movement fixed to 4-directional, unit cost — stated.
- Shows open set, closed set, current cell, g/h/f for the current cell and a hover/focus inspector for any cell; open-set list with f values.
- On success: animated path reconstruction steps, path length, nodes explored, total steps, execution time. On failure: clear "no path — target is enclosed" explanation.
- Complexity: worst case O(V log V) with a binary heap where V = rows × cols (every cell expanded once with a consistent heuristic), space O(V); notes that performance depends on heuristic quality.

Both pages: play/pause, next/previous, restart, reset, speed, keyboard shortcuts (Space, arrows, R), aria-live status line, reduced motion (no transitions), states shown with shape/marker + color (e.g. dashed ring = discovered, double ring = current, check = visited, S/T badges, thick line = path, hatched = wall), mobile: SVG uses viewBox and scales to width, controls stack, 44px targets.

## Technical details

Engine (no React/DOM):
```text
src/algorithms/graph/
  types.ts        GraphNode{id,x,y,label,heuristic?}, GraphEdge{id,source,target,directed,weight}, Graph, GraphStep
  graph-model.ts  pure add/move/remove node/edge, validateEdge, adjacency (sorted by label for determinism), samples
  priority-queue.ts  binary min-heap (shared with A*)
  bfs.ts dfs.ts dijkstra.ts registry.ts
  graph.test.ts
src/algorithms/pathfinding/
  grid.ts         Grid model, neighbours, seeded maze generator
  heuristics.ts   manhattan, euclidean
  astar.ts        GridStep generator
  astar.test.ts
```
- Shared step shape: generalize types.ts with a base `StepBase { type, explanation, metrics, meta?: {codeLine} }`; sorting `AlgorithmStep` extends it unchanged (no sorting rewrite). GraphStep adds nodeStates map, edgeStates, frontier (queue/stack/heap snapshot), order, distances, predecessors, path. GridStep adds open/closed/current, g/h/f maps (sparse), path.
- `AlgorithmDefinition` category widened to "sorting" | "graph" | "pathfinding"; complexity panel reused.
- Tie-breaking deterministic everywhere (label order, then insertion id) so step counts are stable.
- Execution time measured around generation (displayed after mount to avoid hydration mismatch, like sorting).

UI:
- `src/components/graph/` graph-canvas.tsx (SVG, pointer events, arrow markers, weight labels with background), graph-editor-toolbar.tsx, graph-visualizer.tsx, frontier-panel.tsx, distance-table.tsx.
- `src/components/pathfinding/` grid-canvas.tsx (SVG rects), grid-toolbar.tsx, astar-visualizer.tsx, cell-inspector.tsx.
- Editing locked while playback is past step 0 (Reset to edit) to keep visual state consistent with computed steps.
- Routes graph.tsx and pathfinding.tsx updated with unique head() metadata; home category cards switch from "coming soon" to live.

Tests (vitest): BFS/DFS order on known graphs, cyclic graph termination, disconnected graphs (unreached nodes stay unvisited), duplicate-edge rejection, negative/NaN weight rejection, Dijkstra distances vs brute-force/known answers incl. directed case and unreachable target, A* path optimal length vs BFS on unit grids for both heuristics, no-path grid, determinism of step counts.
