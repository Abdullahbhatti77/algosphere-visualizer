import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlgorithmDefinition } from "@/algorithms/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}

export function ComplexityPanel({ algorithm }: { algorithm: AlgorithmDefinition }) {
  const { complexity } = algorithm;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          Complexity
          <Badge variant="secondary" className="font-mono text-[10px]">
            {algorithm.stable ? "stable" : "unstable"}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {algorithm.inPlace ? "in-place" : "out-of-place"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <Row label="Best case (time)" value={complexity.best} />
          <Row label="Average case (time)" value={complexity.average} />
          <Row label="Worst case (time)" value={complexity.worst} />
          <Row label="Space" value={complexity.space} />
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Assumptions: </span>
          {complexity.notes}
        </p>
      </CardContent>
    </Card>
  );
}
