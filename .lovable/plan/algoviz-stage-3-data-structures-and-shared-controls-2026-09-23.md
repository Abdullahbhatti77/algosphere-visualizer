# AlgoViz Stage 3: Data Structures and Shared Controls

Adds a working Data Structures section (Binary Search Tree, Stack, Queue) and makes every visualizer use the same controls, statistics, complexity, and pseudocode building blocks. The existing Sorting, Graph and Pathfinding pages keep their current look and behaviour. Only their internals move onto the shared pieces.

## What the user gets

- **/data-structures** becomes a working page with a tab bar for Binary Search Tree, Stack and Queue. The selected tab is saved in the URL (`?ds=bst|stack|queue`) so links can point straight to it. Each tab has the same layout as the existing pages: the visualization, playback controls, an operation panel, statistics, complexity, an explanation and pseudocode.
- **Binary Search Tree**: an SVG tree with Insert, Delete and Search operations that take a value or a custom list of values, plus Random tree and Reset. Each operation is recorded as a series of steps that you play or step through.
  - The tree shows the root badge, parent/child edges, the node being compared, the path taken so far, a found node (checkmark), a deleted node (struck through, dashed outline), and the in-order successor highlighted in a distinct style.
  - Deletion covers the leaf, one-child and two-child cases, and the explanation names which case applies.
  - The page labels this as an unbalanced BST and explains that its speed depends on the tree's shape. A "Sorted insert" preset builds a degenerate chain so you can see why the worst case is O(n).
- **Stack**: a vertical container with a TOP marker. Operations are Push (a value or a random one), Pop, Peek, Clear and Random fill. An optional bounded mode (capacity 8) shows overflow; popping an empty stack shows underflow. Each operation plays as short steps (for example, check for empty, move the top, remove the item).
- **Queue**: a horizontal row of items with FRONT and REAR markers. Operations are Enqueue, Dequeue, Peek, Clear and Random fill. Items wrap onto a second row on narrow screens, so nothing scrolls sideways.
- **Controls**: operations happen one at a time, so each one creates a short step list. The shared playback bar (Play, Pause, Step, Previous, Reset, Skip to end, Speed) then plays it. Randomize sits in each page's operation panel.

## Shared architecture

```text
src/algorithms/core/
  step-controller.ts   framework-free state machine (no React)
  stats.ts             statistic ids, labels, formatters
  complexity.ts        ComplexityMeta type and validation
  catalog.ts           algorithmRegistry: every algorithm, all categories
src/hooks/use-step-controller.ts   React adapter (subscribe via useSyncExternalStore)
src/components/viz/
  complexity-card.tsx  renders any ComplexityMeta
  stats-card.tsx       renders only the stats an algorithm declares
  pseudocode-panel.tsx gains lightweight keyword/number highlighting
```

- **StepController** (a class with no React inside) exposes `currentStep`, `totalSteps`, `status` (idle / playing / paused / complete), `isPlaying`, `isPaused`, `speed`, `start()`, `pause()`, `resume()`, `next()`, `previous()`, `reset()`, `complete()`, `load(total)` and `subscribe()`. Timing goes through an injectable scheduler, so tests run with a fake clock. The existing `useStepPlayer` becomes a thin wrapper around it with the same return shape, so the sorting, graph and A* pages keep working unchanged.
- **Statistics**: each definition declares `stats: StatId[]` (for example comparisons, swaps, accesses, visited, processed, queueOps, stackOps, treeComparisons, pathLength, explored, elapsed). The stats card shows only those, so no algorithm shows a zero for a statistic it doesn't track.
- **Complexity metadata**: `name`, `category`, `bestTime`, `averageTime`, `worstTime`, `space`, `stable?`, `inPlace?`, `description` and `assumptions[]`. For data structures there is one row per operation (search, insert, delete; push, pop, peek). One complexity card renders it everywhere. The existing sorting, graph and A* numbers move into this format with their values unchanged.
- **algorithmRegistry**: typed entries with `id`, `category`, `displayName`, `complexity`, `description`, `pseudocode`, `implementation` (a step generator or operation runner) and `visualizer` (a string key that points to a component map in the UI layer, so the engine never imports React). Existing registries become views over it.

## Engines (no React)

- `src/algorithms/data-structures/bst.ts`: an immutable-snapshot BST with `insert`, `search` and `delete` (the successor replaces a two-child node). Each operation returns `{ steps, result }`. Every step carries the tree snapshot, a highlight role for each node (comparing, path, found, deleted, successor, inserted), the explanation, the pseudocode line and the number of tree comparisons so far. Duplicate values are rejected with an explanation. The tree is limited to 31 nodes and values from 0 to 999.
- `bst-layout.ts`: in-order x positions and depth-based y positions, so nodes never overlap. The SVG viewBox scales to fit. Below 44px per node it switches to horizontal scrolling and pinch-zoom/pan with zoom buttons, so nodes stay readable.
- `stack.ts` and `queue.ts`: real array-backed structures. The queue uses head-index circular buffer semantics and reports front and rear. Operations emit steps and count stack or queue operations.

## Accessibility and mobile

- Live region announcing each step's explanation
- A text list of the structure's contents (in-order for the BST)
- Labelled inputs, where Enter submits
- Keyboard shortcuts through the existing playback-keys hook
- Reduced motion turns off the transitions
- Every state is marked by a shape or letter as well as color
- Touch targets are at least 40px
- `min-w-0` on all grids, and a mobile check for horizontal overflow

## Tests (vitest)

- BST: insert order and shape, search found and not-found, delete leaf, one-child and two-child cases (in-order output stays sorted and has the correct remaining set), duplicate rejection, deterministic step counts
- Stack: push, pop and peek; underflow; overflow in bounded mode
- Queue: enqueue, dequeue and peek order; empty queue; wrap-around
- Complexity metadata: every registry entry has all required fields and valid Big-O strings; BST average and worst values match the spec
- StepController: idle to playing to paused to complete, next/previous limits, reset, complete, and reload, all with a fake scheduler
- Existing sorting, graph and A* tests keep passing

## Verification

Typecheck, the full vitest run, and Playwright checks on all five pages at desktop and 390px widths: no overflow, no console errors, and BST delete (two-child case) and stack underflow work end to end.
