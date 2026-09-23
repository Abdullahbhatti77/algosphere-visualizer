import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { SortingVisualizer } from "@/components/sorting/sorting-visualizer";

const title = "Sorting Visualizer — AlgoViz";
const description =
  "Step through bubble, merge, quick, and heap sort on a live bar chart with comparisons, swaps, array accesses, and complexity analysis.";

export const Route = createFileRoute("/sort")({
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
  component: SortPage,
});

function SortPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sorting"
        title="Sorting algorithms"
        description="Every frame below is generated from the algorithm's own state transitions — comparisons, swaps, writes, and pivots are recorded as the code runs."
      />
      <SortingVisualizer />
    </>
  );
}
