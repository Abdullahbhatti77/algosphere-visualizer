import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

const title = "Graph Algorithms — AlgoViz";
const description =
  "Breadth-first search, depth-first search, Dijkstra, and minimum spanning trees visualised as real traversal state over an editable graph.";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: GraphPage,
});

function GraphPage() {
  return (
    <>
      <PageHeader
        eyebrow="Graphs"
        title="Graph algorithms"
        description="Traversals and shortest paths over an editable node-link graph, driven by the same step model as sorting."
      />
      <ComingSoon
        title="Graph traversals"
        planned={[
          "Breadth-first search with a live frontier queue",
          "Depth-first search with an explicit stack and discovery/finish times",
          "Dijkstra's algorithm with a priority queue and distance table",
          "Kruskal and Prim minimum spanning trees with union-find state",
        ]}
      />
    </>
  );
}
