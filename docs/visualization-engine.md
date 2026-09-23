# Visualization engine

## Steps

Each algorithm emits `AlgorithmStep`-style records: a full state snapshot,
a human-readable explanation ("Dequeued node B."), the active pseudocode line
and cumulative statistics. Views never mutate state.

## StepController

Framework-free state machine exposing `currentStep`, `totalSteps`,
`isPlaying`, `isPaused`, `speed`, `start()`, `pause()`, `resume()`, `next()`,
`previous()`, `reset()` and `complete()`.

- A single timer is active at a time; reset and new input cancel it.
- Speed changes reschedule the pending tick, so playback never runs two timers.
- Tests cover races: reset during play, speed changes during play, completion.

## Rendering

- Sorting: DOM bars with state patterns and markers (not colour alone).
- Graph and BST: SVG. On narrow screens graph nodes and labels are enlarged
  while positions keep scaling, so they stay readable and tappable.
- A*: CSS grid of cells with open/closed/current/path markers.

## Reduced motion

With `prefers-reduced-motion`, transitions are removed and default playback is
slower; every step still has a text explanation and a final text summary.
