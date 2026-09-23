import { createFileRoute, Link } from "@tanstack/react-router";

import { entriesByCategory } from "@/algorithms/core/catalog";
import { dataStructureVisualizers } from "@/components/data-structures/visualizers";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

const title = "Data Structures — AlgoViz";
const description =
  "Binary search tree, stack, and queue operations replayed step by step from the real structure's state, with complexity and pseudocode.";

const IDS = ["bst", "stack", "queue"] as const;
type DSId = (typeof IDS)[number];

export const Route = createFileRoute("/data-structures")({
  validateSearch: (search: Record<string, unknown>): { ds?: DSId } =>
    IDS.includes(search["ds"] as DSId) ? { ds: search["ds"] as DSId } : {},
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
  component: DataStructuresPage,
});

function DataStructuresPage() {
  const { ds = "bst" } = Route.useSearch();
  const entries = entriesByCategory("data-structure");
  const active = entries.find((e) => e.id === ds) ?? entries[0]!;
  const Visualizer = dataStructureVisualizers[active.visualizer]!;

  return (
    <>
      <PageHeader
        eyebrow="Data Structures"
        title="Data structures"
        description="Insertions, deletions, and lookups animated from the structure's real internal state."
      />
      <nav aria-label="Data structure" className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
        <ul className="flex gap-1 overflow-x-auto border-b border-border">
          {entries.map((e) => (
            <li key={e.id}>
              <Link
                to="/data-structures"
                search={{ ds: e.id as DSId }}
                aria-current={e.id === active.id ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex min-h-10 items-center whitespace-nowrap border-b-2 px-3 text-sm",
                  e.id === active.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {e.displayName}
              </Link>
            </li>
          ))}
        </ul>
        <p className="pt-3 text-sm text-muted-foreground">{active.description}</p>
      </nav>
      <Visualizer key={active.id} />
    </>
  );
}
