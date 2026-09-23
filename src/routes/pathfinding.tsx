import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { AStarVisualizer } from "@/components/pathfinding/astar-visualizer";

const title = "A* Pathfinding on a Grid | AlgoViz";
const description =
  "Draw walls, generate mazes, and watch A* expand its open and closed sets with live g, h, and f scores, using Manhattan or Euclidean heuristics.";

export const Route = createFileRoute("/pathfinding")({
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
  component: PathfindingPage,
});

function PathfindingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pathfinding"
        title="A* search"
        description="A* expands the cell with the lowest f(n) = g(n) + h(n): cost so far plus an admissible estimate of the remaining distance."
      />
      <AStarVisualizer />
    </>
  );
}
