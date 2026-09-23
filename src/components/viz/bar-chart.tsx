import { cn } from "@/lib/utils";
import type { AlgorithmStep } from "@/algorithms/types";

export type BarState = "idle" | "compare" | "swap" | "write" | "pivot" | "sorted";

/** Non-color marker per state so the chart is readable without color. */
const MARKERS: Record<BarState, string> = {
  idle: "",
  compare: "C",
  swap: "S",
  write: "W",
  pivot: "P",
  sorted: "✓",
};

const LABELS: Record<BarState, string> = {
  idle: "",
  compare: "being compared",
  swap: "being swapped",
  write: "being written",
  pivot: "pivot",
  sorted: "in final position",
};

const BAR_CLASSES: Record<BarState, string> = {
  idle: "bg-viz-bar",
  compare: "bg-viz-compare",
  swap: "bg-viz-swap",
  write: "bg-viz-compare",
  pivot: "bg-viz-pivot",
  sorted: "bg-viz-sorted",
};

/** Stripe/dot overlays give each highlighted state a second, non-color cue. */
const BAR_PATTERN: Partial<Record<BarState, string>> = {
  swap: "repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0 3px, transparent 3px 7px)",
  pivot: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.4) 0 2px, transparent 2px 6px)",
  write: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 6px)",
};

export function barStateFor(index: number, step: AlgorithmStep): BarState {
  if (step.sorted.includes(index)) return "sorted";
  if (step.meta?.pivot === index) return "pivot";
  if (step.indices.includes(index)) {
    if (step.type === "swap") return "swap";
    if (step.type === "overwrite") return "write";
    if (step.type === "compare") return "compare";
    if (step.type === "pivot") return "pivot";
    if (step.type === "heapify" || step.type === "select") return "compare";
  }
  return "idle";
}

interface BarChartProps {
  step: AlgorithmStep;
  animate: boolean;
}

export function BarChart({ step, animate }: BarChartProps) {
  const values = step.values;
  const max = Math.max(1, ...values);
  const count = values.length;
  const showValues = count <= 28;
  const showIndices = count <= 20;
  const range = step.meta?.range;

  if (count === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        No data to visualise — generate or enter an array to begin.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-backdrop rounded-md" aria-hidden />
      <ol
        className="relative flex h-64 items-end gap-[2px] px-1 sm:h-80 sm:gap-1"
        aria-label={`Array of ${count} values, current operation: ${step.explanation}`}
      >
        {values.map((value, index) => {
          const state = barStateFor(index, step);
          const inRange = range ? index >= range[0] && index <= range[1] : true;
          const pattern = BAR_PATTERN[state];
          return (
            <li
              key={index}
              className="flex h-full min-w-0 flex-1 flex-col items-center gap-1"
              aria-label={`Index ${index}, value ${value}${state === "idle" ? "" : `, ${LABELS[state]}`}`}
            >
              <span
                aria-hidden
                className={cn(
                  "h-2.5 font-mono text-[10px] leading-none",
                  state === "idle" ? "text-transparent" : "text-foreground",
                )}
              >
                {MARKERS[state] || "·"}
              </span>
              {showValues ? (
                <span
                  aria-hidden
                  className={cn("h-2.5 font-mono text-[10px] leading-none text-foreground", count > 12 && "max-sm:hidden")}
                >
                  {value}
                </span>
              ) : null}
              <span className="flex min-h-0 w-full flex-1 items-end">
                <span
                  aria-hidden
                  style={{
                    height: `${(value / max) * 100}%`,
                    ...(pattern ? { backgroundImage: pattern } : {}),
                  }}
                  className={cn(
                    "w-full rounded-t-[3px] border-t border-black/10 dark:border-white/10",
                    BAR_CLASSES[state],
                    animate && "transition-[height,background-color] duration-150 ease-out",
                    !inRange && state === "idle" && "opacity-45",
                    state !== "idle" && "ring-1 ring-foreground/40",
                  )}
                />
              </span>
              {showIndices ? (
                <span
                  aria-hidden
                  className={cn("h-2.5 font-mono text-[10px] leading-none text-muted-foreground", count > 12 && "max-sm:hidden")}
                >
                  {index}
                </span>
              ) : null}
            </li>

          );
        })}
      </ol>
    </div>
  );
}

export function VizLegend() {
  const entries: BarState[] = ["idle", "compare", "swap", "write", "pivot", "sorted"];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {entries.map((state) => (
        <li key={state} className="flex items-center gap-1.5">
          <span
            aria-hidden
            style={BAR_PATTERN[state] ? { backgroundImage: BAR_PATTERN[state] } : undefined}
            className={cn("inline-block size-3 rounded-sm", BAR_CLASSES[state])}
          />
          <span className="font-mono text-[10px]">{MARKERS[state] || "·"}</span>
          <span className="capitalize">{state === "idle" ? "unsorted" : state}</span>
        </li>
      ))}
    </ul>
  );
}
