# Accessibility

AlgoViz includes practical accessibility work for an interactive visualization app. It does not claim formal WCAG certification.

## Implemented Behaviors

### Keyboard Operation

- Playback controls are ordinary buttons and sliders.
- Data-structure forms can be submitted with Enter.
- A* grid editing supports keyboard cursor movement with arrow keys and applying the selected tool with Enter or Space.
- Global playback shortcuts are available outside form fields:
  - Space: play/pause
  - Left Arrow: previous step
  - Right Arrow: next step
  - R: restart

### Focus Visibility

The global stylesheet defines visible focus outlines for focusable controls. The app also includes a skip-to-content link at the root layout.

### Labels and Semantics

- Playback controls have accessible labels.
- Graph and grid SVG regions expose descriptive labels.
- Tables use captions or clear headings where data is tabular.
- Status and error messages use live regions or alert/status roles where appropriate.

### Text Alternatives for Visual State

Every major visualizer includes text explanations for the current operation. Completed runs include result summaries such as sorted output, traversal order, shortest path, path length, or current data-structure contents.

### Not Color Alone

Visualization states use more than color where practical:

- graph nodes use labels, outlines, dashes, checkmarks, and S/T markers
- graph path edges are thicker than ordinary edges
- A* cells use dots, squares, dashed neighbor outlines, S/T labels, and wall hatching
- BST nodes use marks such as ?, +, ✕, S, ✓, and ↺
- stack and queue operations use labels such as TOP, FRONT, REAR, pushed, popped, and peeked

### Reduced Motion

The stylesheet minimizes transitions when `prefers-reduced-motion: reduce` is active. Sorting and A* also slow playback by default for reduced-motion users so state changes can be read instead of watched quickly.

## Known Limitations

- The visualizations are still spatial and benefit from sighted inspection.
- Very dense traces can produce many screen-reader announcements if played continuously.
- Graph and tree comprehension is easier with the visual layout than with text alone.

Future improvements could include an alternate transcript view for every step and automated accessibility tests.
