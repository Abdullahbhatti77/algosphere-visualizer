import { useCallback, useEffect, useMemo, useState } from "react";

import { getSortingAlgorithm } from "@/algorithms/registry";
import type { AlgorithmStep } from "@/algorithms/types";
import { ArrayControls } from "@/components/viz/array-controls";
import { BarChart, VizLegend } from "@/components/viz/bar-chart";
import { ComplexityPanel } from "@/components/viz/complexity-panel";
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
 * differ between server and client HTML. Users get randomness on demand via
 * the "Generate random array" control.
 */
function defaultArray(size: number): number[] {
  let seed = 20260923;
  return Array.from({ length: size }, () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return 5 + (seed % 96);
  });
}

export function SortingVisualizer() {
  const [algorithmId, setAlgorithmId] = useState("bubble");
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [input, setInput] = useState<number[]>(() => defaultArray(DEFAULT_SIZE));
  const [speed, setSpeed] = useState<SpeedId>("normal");
  const reducedMotion = useReducedMotion();


  const algorithm = getSortingAlgorithm(algorithmId);

  const { steps, generationMs } = useMemo(() => {
    const started =
      typeof performance === "undefined" ? Date.now() : performance.now();
    const generated = algorithm.generate(input);
    const ended = typeof performance === "undefined" ? Date.now() : performance.now();
    return { steps: generated, generationMs: ended - started };
  }, [algorithm, input]);

  const intervalMs = SPEED_LEVELS[speedIndexOf(speed)]!.intervalMs;
  const player = useStepPlayer(steps.length, intervalMs);
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
            generationMs={generationMs}
          />
          <ComplexityPanel algorithm={algorithm} />
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
