import type { AlgorithmDocs } from "@/algorithms/core/catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Section({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <section className="min-w-0">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <List
        className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5 text-sm leading-relaxed`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </section>
  );
}

/** Shared study notes: overview, how it works, when useful, implementation notes. */
export function AlgorithmDocsCard({ name, docs }: { name: string; docs: AlgorithmDocs }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">About {name}</CardTitle>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-5 md:grid-cols-2">
        <section className="min-w-0 md:col-span-2">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overview
          </h3>
          <p className="text-sm leading-relaxed">{docs.overview}</p>
        </section>
        <Section title="How it works" items={docs.howItWorks} ordered />
        <Section title="When it is useful" items={docs.whenUseful} />
        <div className="md:col-span-2">
          <Section title="Implementation assumptions" items={docs.implementationNotes} />
        </div>
      </CardContent>
    </Card>
  );
}
