import { useCallback, useEffect, useRef, useState } from "react";

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
  isPlaying: boolean;
  isFinished: boolean;
  elapsedMs: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
  skipToEnd: () => void;
  goTo: (index: number) => void;
}

/**
 * Drives playback over a pre-computed step list.
 *
 * The player owns only cursor + timing concerns; it never knows what a step
 * means. Stepping backwards is exact because each step carries a full snapshot.
 */
export function useStepPlayer(
  totalSteps: number,
  intervalMs: number,
  /** Changes whenever the step list is regenerated (new algorithm or input). */
  resetKey: string = "",
): StepPlayer {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const runStartRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  const lastIndex = Math.max(0, totalSteps - 1);
  const isFinished = totalSteps === 0 || index >= lastIndex;

  // A new step list (new array or algorithm) resets the cursor and the clock.
  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
    setElapsedMs(0);
    accumulatedRef.current = 0;
    runStartRef.current = null;
  }, [totalSteps, resetKey]);


  const stopClock = useCallback(() => {
    if (runStartRef.current !== null) {
      accumulatedRef.current += performance.now() - runStartRef.current;
      runStartRef.current = null;
      setElapsedMs(accumulatedRef.current);
    }
  }, []);

  const startClock = useCallback(() => {
    if (runStartRef.current === null) runStartRef.current = performance.now();
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopClock();
  }, [stopClock]);

  const play = useCallback(() => {
    if (totalSteps === 0) return;
    setIndex((current) => {
      if (current >= lastIndex) {
        accumulatedRef.current = 0;
        setElapsedMs(0);
        return 0;
      }
      return current;
    });
    startClock();
    setIsPlaying(true);
  }, [lastIndex, startClock, totalSteps]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const advance = useCallback(
    (delta: number) => {
      setIndex((current) => Math.min(lastIndex, Math.max(0, current + delta)));
    },
    [lastIndex],
  );

  const next = useCallback(() => {
    pause();
    advance(1);
  }, [advance, pause]);

  const previous = useCallback(() => {
    pause();
    advance(-1);
  }, [advance, pause]);

  const restart = useCallback(() => {
    pause();
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setIndex(0);
  }, [pause]);

  const skipToEnd = useCallback(() => {
    pause();
    setIndex(lastIndex);
  }, [lastIndex, pause]);

  const goTo = useCallback(
    (target: number) => {
      pause();
      setIndex(Math.min(lastIndex, Math.max(0, Math.round(target))));
    },
    [lastIndex, pause],
  );

  useEffect(() => {
    if (!isPlaying) return;
    if (index >= lastIndex) {
      setIsPlaying(false);
      stopClock();
      return;
    }
    const timer = window.setTimeout(() => setIndex((current) => current + 1), intervalMs);
    return () => window.clearTimeout(timer);
  }, [index, intervalMs, isPlaying, lastIndex, stopClock]);

  // Tick the visible clock while playing.
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      const running = runStartRef.current === null ? 0 : performance.now() - runStartRef.current;
      setElapsedMs(accumulatedRef.current + running);
    }, 100);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return {
    index,
    isPlaying,
    isFinished,
    elapsedMs,
    play,
    pause,
    toggle,
    next,
    previous,
    restart,
    skipToEnd,
    goTo,
  };
}
