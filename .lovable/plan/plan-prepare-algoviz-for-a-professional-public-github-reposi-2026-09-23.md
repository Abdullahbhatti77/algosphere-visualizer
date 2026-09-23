# Plan: Prepare AlgoViz for a professional public GitHub repository

## Goal
Make the existing AlgoViz repository credible for Computer Science Master's admissions review without rebuilding the app, changing the visual direction, or altering core algorithms unless a real correctness issue is found.

## Current state confirmed
- The app already has implemented routes and engines for sorting, graph algorithms, A*, BST, stack, and queue.
- The current README is accurate but too brief for an academic/portfolio repository.
- Existing docs cover architecture, algorithms, visualization engine, complexity, and testing, but they need expansion.
- `docs/accessibility.md`, `docs/development.md`, `.env.example`, and a top-level `screenshots/` folder are not present.
- `.gitignore` covers several generated files but does not explicitly cover all requested environment, build, coverage, log, and temporary patterns.
- `package.json` has `dev`, `build`, `build:dev`, `preview`, `lint`, and `format`, but no explicit `test` script.
- A repository scan did not find obvious secret-like strings in source/documentation candidates.

## Work plan

### 1. Repository cleanup and structure
- Add a top-level `screenshots/` folder with a README listing the intended screenshot filenames:
  - `dashboard.png`
  - `sorting.png`
  - `graph-editor.png`
  - `dijkstra.png`
  - `astar.png`
  - `bst.png`
  - `stack-queue.png`
  - `complexity-panel.png`
- Add `.env.example` with placeholders only, or an explanatory comment if no environment variables are required.
- Update `.gitignore` to explicitly exclude secrets, generated output, coverage, logs, OS files, and temporary files while preserving `.env.example`.
- Update package metadata from the starter default to AlgoViz-specific naming where appropriate.
- Add an explicit test script if missing, so documentation can point to a stable command.

### 2. README rewrite
Replace the brief README with a polished, academically oriented README that includes:
- Title: `AlgoViz — Interactive Algorithm Visualizer`
- Subtitle exactly reflecting step-by-step execution, live complexity information, and real-time statistics.
- Small technology section limited to technologies actually used.
- Project overview, motivation, features, live demo status, screenshots placeholders, architecture diagram, engineering design, algorithm documentation summary, complexity table, testing, accessibility, responsive design, limitations, future work, local development, academic context, and `Why I Built This`.
- Honest language only: no fabricated deployments, metrics, research claims, users, partnerships, awards, or performance numbers.

### 3. Documentation expansion
Update or create the requested documentation files so they match the actual codebase:
- `docs/architecture.md` — module boundaries, algorithm/UI separation, state flow, animation controller, route structure.
- `docs/algorithms.md` — all implemented algorithms with implementation details, pseudocode summaries, complexity, assumptions, and edge cases.
- `docs/visualization-engine.md` — step generation, controller behavior, visual state mapping, reduced-motion behavior, and synchronization.
- `docs/complexity.md` — complexity metadata design, per-algorithm assumptions, and the difference between algorithmic complexity and browser animation cost.
- `docs/testing.md` — current unit/audit testing strategy, commands, covered edge cases, and future testing improvements.
- `docs/accessibility.md` — implemented keyboard, labeling, focus, reduced-motion, text-summary, and non-color indicator behavior only.
- `docs/development.md` — project conventions and how to add a new algorithm, visualizer, tests, and docs using the actual engine/catalog patterns.

### 4. Code quality and user-facing polish review
- Inspect key source files for unused imports, dead code, weak typing, unnecessary assertions, and confusing duplicated patterns.
- Make only safe, focused cleanup changes that do not alter working behavior.
- Review major interactions for friendly validation messages: invalid arrays, empty input, invalid graph weights/configuration, no path, underflow/overflow, large input limits, and reset during playback.
- Keep any code changes minimal and evidence-driven.

### 5. Security review
- Re-run secret-pattern searches after edits.
- Ensure no API keys, tokens, passwords, local filesystem details, or private deployment URLs are documented or committed.
- Ensure `.env` files are ignored and `.env.example` is safe.
- Confirm screenshots are placeholders/documented filenames only unless real screenshots are available.

### 6. Final verification
- Verify the project builds successfully.
- Verify tests run successfully.
- Verify linting if the repository supports it cleanly, or document any pre-existing warnings accurately if cleanup is not safe.
- Verify README commands match `package.json`.
- Verify every documented algorithm and feature exists.
- Verify complexity claims match the implementation and assumptions in the code.
- Verify no fake claims were added.
- Verify the live preview still loads and remains responsive on representative mobile and desktop widths.

## Technical details
- Algorithm logic remains in `src/algorithms/` and must stay independent of React/DOM imports.
- Documentation will reference the existing step-generator → controller → visualizer flow rather than inventing a new architecture.
- Dijkstra will be documented as binary min-heap with lazy deletion.
- A* will be documented as 4-directional, unit-cost grid search with Manhattan/Euclidean heuristics.
- BST will be documented as an ordinary unbalanced BST, not AVL or red-black.
- Stack and queue will be documented as bounded educational visualizations with O(1) operations.

## Out of scope
- No new algorithms.
- No redesign.
- No fabricated screenshots or demo URLs.
- No performance benchmarks unless actually measured.
- No backend, authentication, or deployment setup.
