import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleComplexityProps {
  rows: { label: string; value: string }[];
  notes: string;
}

export function SimpleComplexity({ rows, notes }: SimpleComplexityProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Complexity</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0"
            >
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="font-mono text-xs">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Assumptions: </span>
          {notes}
        </p>
      </CardContent>
    </Card>
  );
}

export function StatGrid({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <dl className="grid min-w-0 grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-md border border-border bg-surface px-3 py-2"
        >
          <dt className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="font-mono text-sm tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
