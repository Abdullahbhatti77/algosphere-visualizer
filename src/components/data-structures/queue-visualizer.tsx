import { useState } from "react";

import { getCatalogEntry } from "@/algorithms/core/catalog";
import {
  clearQueue,
  createQueue,
  dequeue,
  enqueue,
  peekQueue,
  queueItems,
  rearSlot,
  type QueueRole,
  type QueueState,
} from "@/algorithms/data-structures/queue";
import { parseDSValues, randomValues } from "@/algorithms/data-structures/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { DSShell, LegendItem } from "./ds-shell";
import { useDSRunner } from "./use-ds-runner";

const entry = getCatalogEntry("queue");

const ROLE: Partial<Record<QueueRole, { cls: string; tag: string }>> = {
  enqueued: { cls: "border-viz-active bg-viz-active/20", tag: "+ in" },
  dequeued: { cls: "border-viz-swap border-dashed bg-viz-swap/15 line-through", tag: "− out" },
  peeked: { cls: "border-viz-compare bg-viz-compare/20", tag: "👁" },
};

export function QueueVisualizer() {
  const r = useDSRunner<QueueState, QueueRole>(() => createQueue(false, [4, 18, 9]));
  const [text, setText] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const q = r.shown;
  const roles = r.step?.roles ?? {};
  const items = queueItems(q);
  const rear = rearSlot(q);
  const cap = q.buffer.length;
  // During dequeue the removed item is still displayed while being read.
  const doEnqueue = () => {
    const p = parseDSValues(text, 1);
    if ("error" in p) return setError(p.error);
    setError(null);
    r.run(enqueue(r.committed, p.values[0]!));
  };

  return (
    <DSShell
      title="Queue (FIFO)"
      description="Circular buffer: items join at REAR and leave from FRONT. Dequeue advances head instead of shifting items."
      visual={
        <div className="space-y-4 py-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Logical order (front → rear)</p>
            <ol
              aria-label={`Queue, ${q.size} items, front to rear`}
              className="flex min-h-20 flex-wrap items-end gap-2"
            >
              {items.length === 0 && (
                <li className="flex h-14 w-full items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
                  empty
                </li>
              )}
              {items.map(({ item, slot }, i) => {
                const role = roles[item.id];
                const st = role ? ROLE[role] : undefined;
                const isFront = i === 0;
                const isRear = i === items.length - 1;
                return (
                  <li key={item.id} className="flex flex-col items-center gap-0.5">
                    <span className="h-4 font-mono text-[10px] font-bold">
                      {isFront && isRear ? "F·R" : isFront ? "FRONT" : isRear ? "REAR" : ""}
                    </span>
                    <span
                      className={cn(
                        "flex size-12 flex-col items-center justify-center rounded border-2 font-mono text-sm motion-safe:transition-all sm:size-14",
                        st?.cls ??
                          (isFront || isRear
                            ? "border-foreground bg-surface"
                            : "border-border bg-surface"),
                      )}
                    >
                      {item.value}
                      {st && (
                        <span className="font-sans text-[9px] font-semibold no-underline">
                          {st.tag}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">slot {slot}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              Underlying buffer ({cap} slots, head = {q.head})
            </p>
            <ol aria-label="Circular buffer slots" className="flex flex-wrap gap-1">
              {q.buffer.map((cell, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex h-10 w-9 flex-col items-center justify-center rounded border font-mono text-[11px]",
                    cell
                      ? "border-foreground/50 bg-surface"
                      : "border-dashed border-border text-muted-foreground",
                  )}
                >
                  <span>{cell ? cell.value : "·"}</span>
                  <span className="text-[8px] font-bold">
                    {q.size > 0 && i === q.head ? "H" : ""}
                    {i === rear ? "R" : ""}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      }
      legend={
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
          aria-label="Legend"
        >
          <LegendItem marker="+" label="Enqueued" className="border-viz-active bg-viz-active/20" />
          <LegendItem
            marker="−"
            label="Dequeued (dashed)"
            className="border-dashed border-viz-swap"
          />
          <LegendItem marker="👁" label="Peeked" className="border-viz-compare" />
          <LegendItem marker="H" label="Head slot" />
          <LegendItem marker="R" label="Rear slot" />
        </ul>
      }
      operations={
        <>
          <div className="space-y-1.5">
            <Label htmlFor="queue-value">Value, 0–999</Label>
            <Input
              id="queue-value"
              inputMode="numeric"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doEnqueue()}
              aria-invalid={error ? true : undefined}
              aria-describedby="queue-help"
            />
            <p
              id="queue-help"
              className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
              role={error ? "alert" : undefined}
            >
              {error ?? "Enter enqueues this value."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={doEnqueue}>Enqueue</Button>
            <Button variant="outline" onClick={() => r.run(dequeue(r.committed))}>
              Dequeue
            </Button>
            <Button variant="outline" onClick={() => r.run(peekQueue(r.committed))}>
              Front
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              onClick={() => r.run(enqueue(r.committed, randomValues(1)[0]!))}
            >
              Enqueue random
            </Button>
            <Button
              variant="secondary"
              onClick={() => r.replace(createQueue(r.committed.bounded, randomValues(5)))}
            >
              Random fill
            </Button>
            <Button variant="secondary" onClick={() => r.run(clearQueue(r.committed))}>
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="queue-bounded"
              checked={r.committed.bounded}
              onCheckedChange={(on) =>
                r.replace(
                  createQueue(
                    on,
                    queueItems(r.committed)
                      .map((e) => e.item.value)
                      .slice(0, on ? 8 : 16),
                  ),
                )
              }
            />
            <Label htmlFor="queue-bounded" className="text-sm">
              Bounded (capacity 8, no growth)
            </Label>
          </div>
        </>
      }
      operationName={r.result?.operation ?? null}
      explanation={r.step?.explanation ?? null}
      status={r.step?.status ?? null}
      pseudocode={r.result?.pseudocode ?? null}
      codeLine={r.step?.codeLine}
      contents={{
        label: "Front → rear",
        text: items.length ? items.map((e) => e.item.value).join(", ") : "(empty)",
      }}
      stats={{
        ids: entry.stats,
        values: {
          step: r.steps.length ? `${r.player.index + 1}/${r.steps.length}` : "—",
          queueOps: r.step ? r.step.work : null,
          size: q.size,
          capacity: cap,
          operations: q.operations,
        },
        labels: {
          queueOps: "Primitive ops (this op)",
          operations: "Completed ops",
          capacity: "Buffer slots",
        },
      }}
      complexity={entry.complexity}
      docs={entry.docs}
      docsName={entry.displayName}
      player={r.player}
      totalSteps={r.steps.length}
      speed={r.speed}
      onSpeedChange={r.setSpeed}
    />
  );
}
