import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { StepController, type PlaybackStatus } from "@/algorithms/core/step-controller";

export const SPEED_LEVELS = [
  { id: "very-slow", label: "Very Slow", short: "0.25×", intervalMs: 900 },
  { id: "slow", label: "Slow", short: "0.5×", intervalMs: 420 },
  { id: "normal", label: "Normal", short: "1×", intervalMs: 180 },
  { id: "fast", label: "Fast", short: "2×", intervalMs: 70 },
  { id: "very-fast", label: "Very Fast", short: "4×", intervalMs: 20 },
] as const;

export type SpeedId = (typeof SPEED_LEVELS)[number]["id"];

export function speedIndexOf(id: SpeedId): number {
  const index = SPEED_LEVELS.findIndex((level) => level.id === id);
  return index === -1 ? 2 : index;
}

export interface StepPlayer {
  index: number;
  totalSteps: number;
  status: PlaybackStatus;
  isPlaying: boolean;
  isPaused: boolean;
  isFinished: boolean;
  elapsedMs: number;
  play: () => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
  skipToEnd: () => void;
  goTo: (index: number) => void;
}

/**
 * React adapter over the framework-free {@link StepController}.
 * The controller owns cursor, status and timing; this hook only subscribes.
 */
export function useStepPlayer(
  totalSteps: number,
  intervalMs: number,
  /** Changes whenever the step list is regenerated (new algorithm or input). */
  resetKey: string = "",
): StepPlayer {
  const ref = useRef<StepController | null>(null);
  if (ref.current === null) ref.current = new StepController({ totalSteps, intervalMs });
  const controller = ref.current;

  const snap = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => {
    controller.load(totalSteps);
  }, [controller, totalSteps, resetKey]);

  useEffect(() => {
    controller.setSpeed(intervalMs);
  }, [controller, intervalMs]);

  useEffect(() => () => controller.dispose(), [controller]);

  // Until the load effect runs, a freshly regenerated list must not be
  // indexed with the previous cursor.
  const stale = snap.totalSteps !== totalSteps;
  const index = stale ? 0 : snap.currentStep;
  const lastIndex = Math.max(0, totalSteps - 1);

  return useMemo<StepPlayer>(
    () => ({
      index,
      totalSteps,
      status: stale ? "idle" : snap.status,
      isPlaying: !stale && snap.isPlaying,
      isPaused: !stale && snap.isPaused,
      isFinished: totalSteps === 0 || index >= lastIndex,
      elapsedMs: stale ? 0 : snap.elapsedMs,
      play: () => controller.start(),
      pause: () => controller.pause(),
      resume: () => controller.resume(),
      toggle: () => controller.toggle(),
      next: () => controller.next(),
      previous: () => controller.previous(),
      restart: () => controller.reset(),
      skipToEnd: () => controller.complete(),
      goTo: (target: number) => controller.goTo(target),
    }),
    [controller, index, lastIndex, snap, stale, totalSteps],
  );
}
