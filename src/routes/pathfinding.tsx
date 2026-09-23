import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

const title = "Pathfinding — AlgoViz";
const description =
  "A*, Dijkstra, BFS, and greedy best-first search on a grid with walls and weights, visualised node by node.";

export const Route = createFileRoute("/pathfinding")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PathfindingPage,
});

function PathfindingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pathfinding"
        title="Grid pathfinding"
        description="Watch search frontiers expand across a grid you can draw walls on, then see the reconstructed path."
      />
      <ComingSoon
        title="Grid pathfinding"
        planned={[
          "Editable grid with walls, weights, and draggable start/goal cells",
          "A* with selectable Manhattan / Euclidean heuristics and f/g/h readouts",
          "Dijkstra and BFS for comparison against A* on the same grid",
          "Path reconstruction replay plus visited-node and path-length statistics",
        ]}
      />
    </>
  );
}
