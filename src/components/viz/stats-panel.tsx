import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlgorithmStep } from "@/algorithms/types";

interface StatsPanelProps {
  step: AlgorithmStep;
  stepIndex: number;
  totalSteps: number;
  elapsedMs: number;
  generationMs: number;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-mono text-base tabular-nums">{value}</dd>
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StatsPanel({
  step,
  stepIndex,
  totalSteps,
  elapsedMs,
  generationMs,
}: StatsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <dl
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2"
          aria-live="polite"
          aria-atomic="true"
        >
          <Stat label="Step" value={`${totalSteps === 0 ? 0 : stepIndex + 1} / ${totalSteps}`} />
          <Stat label="Comparisons" value={step.metrics.comparisons.toLocaleString()} />
          <Stat label="Swaps" value={step.metrics.swaps.toLocaleString()} />
          <Stat label="Array accesses" value={step.metrics.accesses.toLocaleString()} />
          <Stat label="Playback time" value={`${(elapsedMs / 1000).toFixed(1)}s`} />
          <Stat
            label="Step generation"
            value={generationMs === null ? "—" : `${generationMs.toFixed(2)}ms`}
            hint="Time to run the algorithm"
          />

        </dl>
      </CardContent>
    </Card>
  );
}
