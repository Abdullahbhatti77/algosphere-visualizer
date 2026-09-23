import { createFileRoute } from "@tanstack/react-router";

import { GraphVisualizer } from "@/components/graph/graph-visualizer";
import { PageHeader } from "@/components/layout/page-header";

const title = "Graph Algorithms — BFS, DFS, Dijkstra | AlgoViz";
const description =
  "Build your own graph and watch breadth-first search, depth-first search, and Dijkstra's shortest path run step by step with live queues, stacks, and distance tables.";

export const Route = createFileRoute("/graph")({
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
  component: GraphPage,
});

function GraphPage() {
  return (
    <>
      <PageHeader
        eyebrow="Graphs"
        title="Graph algorithms"
        description="Edit the graph, pick a source, and step through BFS, DFS, or Dijkstra. Every frame is a recorded state of the real algorithm."
      />
      <GraphVisualizer />
    </>
  );
}
