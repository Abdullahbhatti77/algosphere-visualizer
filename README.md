# AlgoSphere Visualizer

Build a production-quality web application called "AlgoViz" — an interactive Computer Science Algorithm Visualizer.

IMPORTANT:
This is a serious Computer Science portfolio project. It should demonstrate algorithmic understanding, state management, animation architecture, responsive UI, accessibility, testing, and clean software engineering.

Do NOT build a generic educational dashboard.
Do NOT use fake/pre-scripted animations.
Every visualization must be generated from the actual algorithm implementation and its state transitions.

TECH STACK

Use:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Lucide icons

SVG/CSS for visualizations where appropriate

Canvas only where it provides a clear advantage

No backend is required.

ARCHITECTURE

Use a modular architecture separating:

Algorithm logic

Algorithm state/step generation

Visualization state

Animation controller

UI components

The algorithm engine must NOT depend directly on React UI components.

Create a generic step model such as:

AlgorithmStep:

type

affectedIndices/nodes

currentState

comparisons

swaps

explanation

optional metadata

Create an animation controller supporting:

play

pause

resume

next step

previous step where technically feasible

restart

reset

skip to end

speed control

The UI must consume algorithm steps rather than implementing algorithm logic itself.

APPLICATION STRUCTURE

Routes/pages:

/
/sort
/graph
/pathfinding
/data-structures
/about

Create a responsive application shell.

NAVIGATION

Algorithms
Sorting
Graphs
Pathfinding
Data Structures
About

DESIGN

Create a polished developer/CS-education visual style.

Use:

clean dark/light compatible design

strong typography

restrained accent colors

subtle borders

technical UI feel

clear data hierarchy

compact controls

professional charts

Do NOT use:

excessive gradients

unnecessary glassmorphism

fake AI branding

stock illustrations

oversized hero sections

The visualization should be the focus.

MOBILE RESPONSIVENESS

The application must be fully responsive.

On mobile:

controls should stack intelligently

visualization should remain readable

horizontal overflow should be avoided where possible

algorithm information should remain accessible

bottom/compact controls may be used where appropriate

ACCESSIBILITY

Support:

keyboard navigation

visible focus states

accessible labels

semantic headings

reduced-motion preference

non-color indicators for algorithm states

HOME PAGE

Create a concise landing page containing:

Title:
"See Algorithms Think."

Subtitle:
"Interactive visualizations of sorting, graph, pathfinding, and data-structure algorithms."

Show categories:
Sorting
Graph Algorithms
Pathfinding
Data Structures

Include a short explanation of:

step-by-step execution

complexity analysis

interactive input

algorithm statistics

SORTING PAGE

Implement:

Bubble Sort
Merge Sort
Quick Sort
Heap Sort

VISUALIZATION

Use an animated vertical bar chart.

Each bar represents an array value.

During execution visually distinguish:

active comparison

swap

pivot

sorted region

current operation

Do not rely only on color; also use labels/patterns/position or other visual cues where practical.

USER CONTROLS

Allow:

generate random array

set array size

enter custom comma-separated values

choose algorithm

play

pause

step forward

reset

speed slider

Speed should support at least:
Very Slow
Slow
Normal
Fast
Very Fast

STATISTICS

Display live:

current step

total generated steps

comparisons

swaps

array accesses where available

elapsed execution time

COMPLEXITY PANEL

Show for each algorithm:

Bubble Sort
Best: O(n)
Average: O(n²)
Worst: O(n²)
Space: O(1)

Merge Sort
Best: O(n log n)
Average: O(n log n)
Worst: O(n log n)
Space: O(n)

Quick Sort
Best: O(n log n)
Average: O(n log n)
Worst: O(n²)
Space: state the actual implementation's complexity

Heap Sort
Best: O(n log n)
Average: O(n log n)
Worst: O(n log n)
Space: O(1) for the standard in-place implementation

Do not hard-code incorrect complexity values for a modified implementation. Document assumptions.

ALGORITHM EXPLANATION

Below the visualization show:

algorithm overview

how it works

current operation explanation

pseudocode

complexity

practical notes

STEP EXPLANATION

At every step, provide a short human-readable explanation such as:

"Comparing positions 3 and 4."

"Swapping 12 and 7."

"Selecting 21 as the pivot."

"Heapifying the subtree rooted at index 2."

Do not generate explanations randomly. They should correspond to actual algorithm state.

CODE QUALITY

Use strict TypeScript.

Create reusable components and types.

Create reusable visualization primitives.

Do not place all logic in one component.

Add empty/loading/error-safe states where appropriate.

Before finishing this stage, ensure:

TypeScript builds

sorting algorithms produce correct sorted arrays

step counts are deterministic for the same input/configuration

visual state matches actual algorithm state

controls work correctly

mobile layout works

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b0ab6e33-3924-4677-b909-5111d770dd34).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
