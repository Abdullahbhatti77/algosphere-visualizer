import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Gauge,
  Keyboard,
  ListOrdered,
  Route as RouteIcon,
  Share2,
  Sigma,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const title = "AlgoViz — See Algorithms Think.";
const description =
  "Interactive visualizations of sorting, graph, pathfinding, and data-structure algorithms, generated from real algorithm state transitions.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

const CATEGORIES = [
  {
    to: "/sort",
    label: "Sorting",
    icon: BarChart3,
    body: "Bubble, merge, quick, and heap sort on an animated bar chart with live comparison and swap counts.",
    status: "Available",
  },
  {
    to: "/graph",
    label: "Graph Algorithms",
    icon: Share2,
    body: "BFS, DFS, and Dijkstra over a graph you build and edit yourself.",
    status: "Available",
  },
  {
    to: "/pathfinding",
    label: "Pathfinding",
    icon: RouteIcon,
    body: "A* with Manhattan or Euclidean heuristics across a grid you can draw walls on.",
    status: "Available",
  },
  {
    to: "/data-structures",
    label: "Data Structures",
    icon: Boxes,
    body: "Binary search tree, stack, and queue, operation by operation.",
    status: "Available",
  },
] as const;

const FEATURES = [
  {
    icon: ListOrdered,
    heading: "Step-by-step execution",
    body: "Algorithms run once and record every comparison, swap, and write. Play, pause, scrub, or step forwards and backwards through the exact transitions.",
  },
  {
    icon: Sigma,
    heading: "Complexity analysis",
    body: "Best, average, worst, and space bounds for each algorithm, with the implementation assumptions behind them spelled out.",
  },
  {
    icon: Keyboard,
    heading: "Interactive input",
    body: "Generate random arrays, set the size, or type your own comma-separated values and watch the algorithm handle them.",
  },
  {
    icon: Gauge,
    heading: "Algorithm statistics",
    body: "Live step position, comparisons, swaps, array accesses, playback time, and how long the algorithm itself took to run.",
  },
];

function Index() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <section className="border-b border-border py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Algorithm visualizer
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          See Algorithms Think.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Interactive visualizations of sorting, graph, pathfinding, and data-structure algorithms.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/sort">
              Start with sorting <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/about">How it works</Link>
          </Button>
        </div>
      </section>

      <section className="py-10" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-lg font-semibold tracking-tight">
          Categories
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.to}
              to={category.to}
              className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <category.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 flex items-center gap-2 text-sm font-semibold">
                {category.label}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{category.body}</p>
              <Badge
                variant={category.status === "Available" ? "default" : "secondary"}
                className="mt-3 text-[10px]"
              >
                {category.status}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-10" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-lg font-semibold tracking-tight">
          What you get on every visualizer
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.heading}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <feature.icon className="size-4 text-primary" aria-hidden />
                  {feature.heading}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
