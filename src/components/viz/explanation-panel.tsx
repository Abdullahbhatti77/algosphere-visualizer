import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PseudocodePanel } from "@/components/viz/pseudocode-panel";
import type { AlgorithmDefinition, AlgorithmStep } from "@/algorithms/types";

interface ExplanationPanelProps {
  algorithm: AlgorithmDefinition;
  step: AlgorithmStep;
}

export function ExplanationPanel({ algorithm, step }: ExplanationPanelProps) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Card className="min-w-0">

        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{algorithm.name} — overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{algorithm.overview}</p>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide">How it works</h3>
            <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {algorithm.howItWorks.map((item, index) => (
                <li key={item} className="flex gap-2">
                  <span className="font-mono text-xs text-primary">{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide">Practical notes</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {algorithm.practicalNotes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span aria-hidden className="text-primary">
                    —
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pseudocode &amp; current operation</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-3">

          <div className="rounded-md border border-border bg-accent/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Current operation
            </p>
            <p className="mt-1 text-sm" aria-live="polite">
              {step.explanation}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              type: {step.type}
              {step.indices.length ? ` · indices: [${step.indices.join(", ")}]` : ""}
              {step.meta?.range ? ` · range: ${step.meta.range[0]}–${step.meta.range[1]}` : ""}
              {typeof step.meta?.depth === "number" ? ` · depth: ${step.meta.depth}` : ""}
            </p>
          </div>
          <PseudocodePanel lines={algorithm.pseudocode} activeLine={step.meta?.codeLine} />
        </CardContent>
      </Card>
    </div>
  );
}
