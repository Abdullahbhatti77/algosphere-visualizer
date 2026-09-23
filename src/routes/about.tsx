import { createFileRoute, Link } from "@tanstack/react-router";

import { algorithmRegistry } from "@/algorithms/core/catalog";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const title = "About AlgoViz — Why it exists and how it works";
const description =
  "Why AlgoViz makes algorithm behaviour observable: step-based execution, complexity awareness, interactive experimentation, and correctness-first engineering.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const FOCUS = [
  {
    heading: "Algorithm visualization",
    body: "Every bar, node, cell and box on screen is drawn from a snapshot the algorithm produced. Nothing is choreographed by hand, so the picture can only show what the code actually did.",
  },
  {
    heading: "Step-based execution",
    body: "Algorithms run once and record each state transition as a structured step: what changed, which elements were involved, the counters so far, and a sentence explaining why. You can play, pause, scrub, and step backwards exactly.",
  },
  {
    heading: "Complexity awareness",
    body: "Each algorithm states best, average and worst time, space, and the implementation assumptions behind those bounds. Live counters — comparisons, swaps, edge checks, nodes explored — let you compare the theory with what a particular input costs.",
  },
  {
    heading: "Interactive experimentation",
    body: "Type your own arrays, draw graphs and mazes, insert into a tree in sorted order to watch it degrade into a chain. Changing the input and replaying is the fastest way to see why a worst case is a worst case.",
  },
  {
    heading: "Correctness",
    body: "Engines are plain TypeScript with no React imports, and they are tested against reference models: built-in sort, Bellman–Ford distances, BFS path lengths on grids, and sorted-set and array models for the data structures. The tests also check that every step accounts for exactly the state change it reports.",
  },
];

const NOT = [
  "It is not a benchmark suite. Elapsed and compute times are shown for the run you are watching, not as performance claims.",
  "It is not a research project and makes no claims about learning outcomes.",
  "Visual limits (60 array values, 26 graph nodes, 31 tree nodes, 16 stack/queue items) exist so every step stays readable, not because the algorithms cannot handle more.",
];

const PIPELINE = `Algorithm (pure TypeScript)
   ↓  records transitions
Step generator  →  AlgorithmStep[] (snapshots + metrics + explanation)
   ↓
Animation controller  (StepController: cursor, status, speed, clock)
   ↓
Visualization state  (the step at the cursor)
   ↓
React UI  (renders that step — never re-runs the algorithm)`;

function AboutPage() {
  const counts = {
    sorting: algorithmRegistry.filter((e) => e.category === "sorting").length,
    graph: algorithmRegistry.filter((e) => e.category === "graph").length,
    pathfinding: algorithmRegistry.filter((e) => e.category === "pathfinding").length,
    ds: algorithmRegistry.filter((e) => e.category === "data-structure").length,
  };
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Why AlgoViz exists"
        description="Algorithms are usually taught as black boxes: input goes in, output comes out, and a Big-O label sits beside them. AlgoViz makes the behaviour in between observable."
      />
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        <section aria-labelledby="focus" className="space-y-4">
          <h2 id="focus" className="text-lg font-semibold tracking-tight">
            What the project focuses on
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FOCUS.map((f) => (
              <Card key={f.heading} className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{f.heading}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="arch" className="space-y-3">
          <h2 id="arch" className="text-lg font-semibold tracking-tight">
            Architecture
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The same pipeline drives every page. Because the UI only ever reads a recorded step,
            what you see is guaranteed to match the code that ran.
          </p>
          <pre
            className="overflow-x-auto rounded-md border border-border bg-surface p-4 font-mono text-xs leading-relaxed"
            aria-label="Architecture pipeline"
          >
            {PIPELINE}
          </pre>
          <p className="text-sm text-muted-foreground">
            Currently implemented: {counts.sorting} sorting algorithms, {counts.graph} graph
            algorithms, {counts.pathfinding} pathfinding algorithm and {counts.ds} data structures —
            all listed in one typed catalogue with their complexity metadata and documentation.
          </p>
        </section>

        <section aria-labelledby="a11y" className="space-y-3">
          <h2 id="a11y" className="text-lg font-semibold tracking-tight">
            Accessibility
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              Every visual state carries a letter, symbol, outline or pattern in addition to its
              colour.
            </li>
            <li>
              The current step is announced through a polite live region, and each page prints a
              text summary of the result.
            </li>
            <li>
              All controls are keyboard operable with visible focus; Space, ← / → and R control
              playback.
            </li>
            <li>
              With the reduced-motion preference, transitions are removed and playback starts
              slower; state is still conveyed through text.
            </li>
          </ul>
        </section>

        <section aria-labelledby="not" className="space-y-3">
          <h2 id="not" className="text-lg font-semibold tracking-tight">
            What AlgoViz is not
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
            {NOT.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-muted-foreground">
          Start with{" "}
          <Link to="/sort" className="text-primary underline-offset-4 hover:underline">
            sorting
          </Link>
          , draw a graph on the{" "}
          <Link to="/graph" className="text-primary underline-offset-4 hover:underline">
            graphs
          </Link>{" "}
          page, or break a tree on the{" "}
          <Link to="/data-structures" className="text-primary underline-offset-4 hover:underline">
            data structures
          </Link>{" "}
          page.
        </p>
      </div>
    </>
  );
}
