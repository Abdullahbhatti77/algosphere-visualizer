import { useCallback, useEffect, useMemo, useState } from "react";

import { getSortingAlgorithm } from "@/algorithms/registry";
import type { AlgorithmStep } from "@/algorithms/types";
import { ArrayControls } from "@/components/viz/array-controls";
import { BarChart, VizLegend } from "@/components/viz/bar-chart";
import { getCatalogEntry } from "@/algorithms/core/catalog";
import { ComplexityCard } from "@/components/viz/complexity-card";
import { ExplanationPanel } from "@/components/viz/explanation-panel";
import { PlaybackBar } from "@/components/viz/playback-bar";
import { StatsPanel } from "@/components/viz/stats-panel";
import { Card, CardContent } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SPEED_LEVELS, speedIndexOf, useStepPlayer, type SpeedId } from "@/hooks/use-step-player";
import { randomArray } from "@/lib/array-input";

const EMPTY_STEP: AlgorithmStep = {
  type: "init",
  indices: [],
  values: [],
  sorted: [],
  metrics: { comparisons: 0, swaps: 0, accesses: 0 },
  explanation: "Waiting for input.",
};

const DEFAULT_SIZE = 24;

/**
 * Deterministic starting array: generating a random one during render would
 * make the server and client HTML disagree. Users get randomness on demand via
 * the "Generate random array" control.
 */
const SEED_VALUES = [
  47, 12, 88, 33, 61, 9, 74, 25, 96, 40, 17, 68, 53, 81, 6, 29, 92, 44, 70, 21, 58, 85, 14, 36, 63,
  99, 27, 50, 77, 11, 39, 66, 93, 20, 45, 72, 8, 31, 57, 84, 16, 42, 69, 95, 23, 48, 75, 13, 34, 60,
  87, 19, 41, 67, 94, 22, 52, 79, 10, 30,
];

function defaultArray(size: number): number[] {
  return SEED_VALUES.slice(0, size);
}


export function SortingVisualizer() {
  const [algorithmId, setAlgorithmId] = useState("bubble");
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [input, setInput] = useState<number[]>(() => defaultArray(DEFAULT_SIZE));
  const [speed, setSpeed] = useState<SpeedId>("normal");
  const reducedMotion = useReducedMotion();
  // Reduced motion: slow playback down so each state can be read, not watched.
  useEffect(() => {
    if (reducedMotion) setSpeed("slow");
  }, [reducedMotion]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const algorithm = getSortingAlgorithm(algorithmId);

  const { steps, generationMs } = useMemo(() => {
    const started = typeof performance === "undefined" ? Date.now() : performance.now();
    const generated = algorithm.generate(input);
    const ended = typeof performance === "undefined" ? Date.now() : performance.now();
    return { steps: generated, generationMs: ended - started };
  }, [algorithm, input]);


  const intervalMs = SPEED_LEVELS[speedIndexOf(speed)]!.intervalMs;
  const player = useStepPlayer(steps.length, intervalMs, `${algorithmId}:${input.join(",")}`);

  const step = steps[player.index] ?? EMPTY_STEP;

  const randomise = useCallback(() => setInput(randomArray(size)), [size]);

  const handleSize = useCallback((next: number) => {
    setSize(next);
    setInput(randomArray(next));
  }, []);

  const handleCustom = useCallback((values: number[]) => {
    setSize(values.length);
    setInput(values);
  }, []);

  // Keyboard shortcuts, ignored while typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === " ") {
        event.preventDefault();
        player.toggle();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        player.next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        player.previous();
      } else if (event.key.toLowerCase() === "r") {
        player.restart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [player]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <BarChart step={step} animate={!reducedMotion} />
              <VizLegend />
              <p className="rounded-md bg-muted px-3 py-2 text-sm" aria-live="polite">
                {step.explanation}
              </p>
              {player.isFinished && steps.length > 1 && (
                <p className="text-xs text-muted-foreground" role="status">
                  <span className="font-medium text-foreground">Result: </span>
                  sorted {step.values.length} value{step.values.length === 1 ? "" : "s"} in {steps.length} steps — {step.metrics.comparisons} comparisons, {step.metrics.swaps} swaps, {step.metrics.accesses} array accesses. Final order: {step.values.join(", ")}.
                </p>
              )}
            </CardContent>
          </Card>
          <ExplanationPanel algorithm={algorithm} step={step} />
        </div>

        <aside className="space-y-4 lg:min-w-0">
          <ArrayControls
            algorithmId={algorithmId}
            onAlgorithmChange={setAlgorithmId}
            size={size}
            onSizeChange={handleSize}
            onRandomise={randomise}
            onCustomValues={handleCustom}
          />
          <StatsPanel
            step={step}
            stepIndex={player.index}
            totalSteps={steps.length}
            elapsedMs={player.elapsedMs}
            generationMs={mounted ? generationMs : null}
          />
          <ComplexityCard meta={getCatalogEntry(algorithm.id).complexity} />
          <p className="text-xs text-muted-foreground">
            Keyboard: <kbd className="font-mono">Space</kbd> play/pause,{" "}
            <kbd className="font-mono">←</kbd>/<kbd className="font-mono">→</kbd> step,{" "}
            <kbd className="font-mono">R</kbd> restart.
          </p>
        </aside>
      </div>

      <PlaybackBar
        player={player}
        totalSteps={steps.length}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
