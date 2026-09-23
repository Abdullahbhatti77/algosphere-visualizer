import { useCallback, useEffect, useState } from "react";

import type { DSOperationResult, DSStep } from "@/algorithms/data-structures/types";
import { SPEED_LEVELS, speedIndexOf, useStepPlayer, type SpeedId } from "@/hooks/use-step-player";

/**
 * Discrete-operation driver: each operation runs the real engine once on the
 * committed structure, commits its final state, and plays its recorded steps.
 */
export function useDSRunner<S, R extends string>(initial: () => S) {
  const [committed, setCommitted] = useState<S>(initial);
  const [result, setResult] = useState<DSOperationResult<S, R> | null>(null);
  const [runId, setRunId] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState<SpeedId>("slow");
  const steps: DSStep<S, R>[] = result?.steps ?? [];
  const player = useStepPlayer(
    steps.length,
    SPEED_LEVELS[speedIndexOf(speed)]!.intervalMs,
    String(runId),
  );

  useEffect(() => {
    if (autoPlay && runId > 0) player.play();
    // Only when a new operation has been loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const run = useCallback((next: DSOperationResult<S, R>) => {
    setCommitted(next.state);
    setResult(next);
    setAutoPlay(true);
    setRunId((n) => n + 1);
  }, []);

  /** Replace the structure without an animated trace (random fill, reset). */
  const replace = useCallback((state: S) => {
    setCommitted(state);
    setResult(null);
    setAutoPlay(false);
    setRunId((n) => n + 1);
  }, []);

  const step = steps[player.index];
  return {
    committed,
    shown: step?.state ?? committed,
    step,
    steps,
    result,
    player,
    speed,
    setSpeed,
    run,
    replace,
  };
}
