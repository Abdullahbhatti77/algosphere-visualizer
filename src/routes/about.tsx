import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const title = "About AlgoViz — architecture and design notes";
const description =
  "How AlgoViz separates algorithm logic, step generation, animation control, and UI — plus its accessibility and design decisions.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AboutPage,
});

const SECTIONS = [
  {
    heading: "Step-generation engine",
    body: "Each algorithm is an ordinary TypeScript function that mutates a working array through a recorder. The recorder counts comparisons, swaps, and array accesses and snapshots the array after every transition, producing a deterministic AlgorithmStep[] for a given input.",
  },
  {
    heading: "Animation controller",
    body: "A single hook owns the playback cursor: play, pause, resume, next, previous, restart, skip to end, scrub, and five speed levels. Because every step carries a full snapshot, stepping backwards is exact rather than reconstructed.",
  },
  {
    heading: "Separation of concerns",
    body: "Nothing under src/algorithms imports React. The UI renders the step it is handed — it never re-implements algorithm logic, so what you see always matches the code that ran.",
  },
  {
    heading: "Accessibility",
    body: "Controls are keyboard operable with visible focus rings and explicit labels, headings are semantic, the current operation is announced through a live region, every visual state carries a letter marker and pattern alongside its color, and the reduced-motion preference disables transitions.",
  },
  {
    heading: "Design",
    body: "Low-chroma surfaces, one restrained accent, monospaced numerics, and compact controls keep attention on the data. No oversized hero, no decorative gradients.",
  },
  {
    heading: "Complexity claims",
    body: "Each complexity panel documents the assumptions behind its bounds — bubble sort's O(n) best case depends on the early-exit flag, this quick sort uses a last-element pivot with O(log n) average recursion depth, merge sort allocates O(n) auxiliary buffers, and heap sort sifts down iteratively for O(1) space.",
  },
];

function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="How AlgoViz is built"
        description="A Computer Science portfolio project: real algorithm implementations, recorded state transitions, and a UI that only renders what the algorithm actually did."
      />
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.heading}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{section.heading}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
