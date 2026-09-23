# AlgoViz — Interactive Algorithm Visualizer (Stage 1: Sorting)

An app where you watch real algorithms run step by step. Every frame comes from the actual algorithm implementation, not a canned animation.

## What you'll get in this stage

**Home** — "See Algorithms Think." with the subtitle, four category cards (Sorting, Graph Algorithms, Pathfinding, Data Structures), and a short section explaining step-by-step execution, complexity analysis, interactive input, and live statistics.

**Sorting** (the fully built page) — Bubble, Merge, Quick, and Heap sort on an animated vertical bar chart:
- Bars highlight the active comparison, the swap, the pivot, and the sorted region — each marked with a small label/pattern as well as color, so it reads without relying on color alone.
- Controls: pick algorithm, random array, array size, custom comma-separated values, play/pause, step forward, step back, restart, skip to end, reset, and a five-level speed selector (Very Slow → Very Fast).
- Live stats: current step, total steps, comparisons, swaps, array accesses, elapsed time.
- Complexity panel with correct best/average/worst/space per algorithm, including a note that this Quick Sort is in-place with O(log n) average recursion depth (O(n) worst) and Heap Sort is O(1) in-place.
- Below the chart: overview, how it works, the current step's plain-language explanation ("Swapping 12 and 7."), pseudocode, complexity, and practical notes.

**Graphs / Pathfinding / Data Structures** — routed pages with the shell, page headings, metadata, and a clear "in development" panel describing what lands there next. These get real visualizers in the next stages.

**About** — what the project is, how the engine works, and the design/accessibility choices.

Shared shell: responsive header nav plus a mobile drawer, dark/light support, keyboard-operable controls with visible focus, semantic headings, and reduced-motion respected.

## Technical notes

- Stack is the project's TanStack Start + React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + Lucide. No backend.
- Layering, with the engine free of any React import:
  - `src/algorithms/types.ts` — `AlgorithmStep` (`type`, `indices`, `array` snapshot/state, `comparisons`, `swaps`, `accesses`, `explanation`, `meta`), `AlgorithmMeta`, `ComplexityInfo`.
  - `src/algorithms/sorting/{bubble,merge,quick,heap}.ts` — generator functions returning a deterministic `AlgorithmStep[]` for a given input.
  - `src/algorithms/registry.ts` — id → generator + metadata + pseudocode + complexity.
  - `src/hooks/usePlayer.ts` — animation controller (play, pause, resume, next, prev, restart, reset, skip to end, speed) driven by `requestAnimationFrame` with a per-speed step interval; reduced-motion forces discrete stepping.
  - `src/components/viz/*` — `BarChart`, `Legend`, `StatsPanel`, `ComplexityPanel`, `PseudocodePanel`, `ControlBar` — presentational, step-driven.
- Merge sort records write-back steps against a single working array so the bar chart always mirrors true algorithm state.
- Strict TS; each route defines its own `head()` with unique title/description/og tags.
- Vitest specs assert each algorithm sorts correctly (including duplicates, sorted, reverse, single, empty inputs) and that step counts are deterministic for identical input.
