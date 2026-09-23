import type { ReactNode } from "react";

import type { ComplexityMeta } from "@/algorithms/core/complexity";
import type { StatId, StatValues } from "@/algorithms/core/stats";
import type { DSStatus } from "@/algorithms/data-structures/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplexityCard } from "@/components/viz/complexity-card";
import { PlaybackBar } from "@/components/viz/playback-bar";
import { PseudocodePanel } from "@/components/viz/pseudocode-panel";
import { StatsCard } from "@/components/viz/stats-card";
import { usePlaybackKeys } from "@/hooks/use-playback-keys";
import type { SpeedId, StepPlayer } from "@/hooks/use-step-player";

const STATUS_TEXT: Partial<Record<DSStatus, string>> = {
  underflow: "Underflow",
  overflow: "Overflow",
  duplicate: "Duplicate rejected",
  "not-found": "Not found",
  full: "Tree full",
  invalid: "Invalid input",
};

interface DSShellProps {
  title: string;
  description: string;
  visual: ReactNode;
  legend?: ReactNode;
  operations: ReactNode;
  operationName: string | null;
  explanation: string | null;
  status: DSStatus | null;
  pseudocode: readonly string[] | null;
  codeLine: number | undefined;
  contents: { label: string; text: string };
  stats: { ids: readonly StatId[]; values: StatValues; labels?: Partial<Record<StatId, string>> };
  complexity: ComplexityMeta;
  player: StepPlayer;
  totalSteps: number;
  speed: SpeedId;
  onSpeedChange: (s: SpeedId) => void;
  note?: ReactNode;
}

export function DSShell(props: DSShellProps) {
  usePlaybackKeys(props.player);
  const bad = props.status && props.status !== "ok" ? STATUS_TEXT[props.status] : null;
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{props.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{props.description}</p>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3">
              {props.visual}
              {props.legend}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="space-y-2 pt-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium uppercase tracking-wide">Current operation</span>
                {props.operationName && <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{props.operationName}</code>}
                {props.totalSteps > 0 && <span className="font-mono tabular-nums">step {props.player.index + 1}/{props.totalSteps}</span>}
              </div>
              <p role="status" aria-live="polite" className="min-h-10 text-sm leading-relaxed">
                {props.explanation ?? "Choose an operation below. Each one runs on the real structure and is replayed step by step."}
              </p>
              {bad && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs font-medium">⚠ {bad}</AlertDescription>
                </Alert>
              )}
              <p className="break-words font-mono text-xs text-muted-foreground">
                <span className="font-sans font-medium text-foreground">{props.contents.label}: </span>
                {props.contents.text}
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">{props.operations}</CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4" aria-label="Details">
          <StatsCard ids={props.stats.ids} values={props.stats.values} labels={props.stats.labels} />
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pseudocode</CardTitle>
            </CardHeader>
            <CardContent>
              {props.pseudocode ? (
                <PseudocodePanel lines={props.pseudocode} activeLine={props.codeLine} />
              ) : (
                <p className="text-xs text-muted-foreground">Run an operation to see its pseudocode trace.</p>
              )}
            </CardContent>
          </Card>
          <ComplexityCard meta={props.complexity} />
          {props.note}
          <p className="text-xs text-muted-foreground">
            Keyboard: <kbd className="font-mono">Space</kbd> play/pause, <kbd className="font-mono">←</kbd>/<kbd className="font-mono">→</kbd> step, <kbd className="font-mono">R</kbd> restart the current operation. Press <kbd className="font-mono">Enter</kbd> in a value field to run the main action.
          </p>
        </aside>
      </div>
      <PlaybackBar player={props.player} totalSteps={props.totalSteps} speed={props.speed} onSpeedChange={props.onSpeedChange} />
    </div>
  );
}

/** Small legend chip: swatch/marker plus text, never color alone. */
export function LegendItem({ marker, label, className }: { marker: ReactNode; label: string; className?: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={`inline-flex size-5 items-center justify-center rounded border text-[10px] font-bold ${className ?? ""}`}>{marker}</span>
      {label}
    </li>
  );
}
