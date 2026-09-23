import type { ComplexityMeta } from "@/algorithms/core/complexity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}

/** Renders any algorithm's complexity metadata. */
export function ComplexityCard({ meta }: { meta: ComplexityMeta }) {
  const uniform = meta.bestTime === meta.averageTime && meta.averageTime === meta.worstTime;
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          Complexity
          {meta.stable !== undefined && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {meta.stable ? "stable" : "unstable"}
            </Badge>
          )}
          {meta.inPlace !== undefined && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {meta.inPlace ? "in-place" : "out-of-place"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meta.operations ? (
          <table className="w-full text-xs">
            <caption className="sr-only">Time complexity per operation</caption>
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="py-1.5 font-normal">Operation</th>
                <th scope="col" className="py-1.5 text-right font-normal">Average</th>
                <th scope="col" className="py-1.5 text-right font-normal">Worst</th>
              </tr>
            </thead>
            <tbody>
              {meta.operations.map((op) => (
                <tr key={op.operation} className="border-b border-border">
                  <th scope="row" className="py-1.5 text-left font-normal text-muted-foreground">{op.operation}</th>
                  <td className="py-1.5 text-right font-mono">{op.average}</td>
                  <td className="py-1.5 text-right font-mono">{op.worst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <dl>
          {!meta.operations &&
            (uniform ? (
              <Row label="Time" value={meta.worstTime} />
            ) : (
              <>
                <Row label="Best case (time)" value={meta.bestTime} />
                <Row label="Average case (time)" value={meta.averageTime} />
                <Row label="Worst case (time)" value={meta.worstTime} />
              </>
            ))}
          <Row label="Space" value={meta.space} />
          {meta.notation?.map((n) => <Row key={n.symbol} label={n.symbol} value={n.meaning} />)}
        </dl>
        <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Assumptions: </span>
          {meta.assumptions.length === 1 ? (
            meta.assumptions[0]
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {meta.assumptions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
