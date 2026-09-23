import { useState } from "react";

import { getCatalogEntry } from "@/algorithms/core/catalog";
import {
  clearStack,
  createStack,
  DEFAULT_STACK_CAPACITY,
  MAX_STACK_ITEMS,
  peek,
  pop,
  push,
  type StackRole,
  type StackState,
} from "@/algorithms/data-structures/stack";
import { parseDSValues, randomValues } from "@/algorithms/data-structures/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { DSShell, LegendItem } from "./ds-shell";
import { useDSRunner } from "./use-ds-runner";

const entry = getCatalogEntry("stack");

const ROLE: Record<StackRole, { cls: string; tag: string }> = {
  top: { cls: "border-foreground bg-surface", tag: "" },
  pushed: { cls: "border-viz-active bg-viz-active/20", tag: "+ pushed" },
  popped: { cls: "border-viz-swap border-dashed bg-viz-swap/15 line-through", tag: "− popped" },
  peeked: { cls: "border-viz-compare bg-viz-compare/20", tag: "👁 peek" },
  checking: { cls: "border-viz-compare", tag: "?" },
};

export function StackVisualizer() {
  const r = useDSRunner<StackState, StackRole>(() => createStack(DEFAULT_STACK_CAPACITY, [12, 7, 33]));
  const [text, setText] = useState("42");
  const [error, setError] = useState<string | null>(null);
  const s = r.shown;
  const roles = r.step?.roles ?? {};
  const limit = s.capacity ?? MAX_STACK_ITEMS;
  const top = s.items.length - 1;

  const doPush = () => {
    const p = parseDSValues(text, 1);
    if ("error" in p) return setError(p.error);
    setError(null);
    r.run(push(r.committed, p.values[0]!));
  };

  const slots = Array.from({ length: s.capacity ?? Math.max(s.items.length, 1) }, (_, i) => s.items[i] ?? null);

  return (
    <DSShell
      title="Stack (LIFO)"
      description="Array-backed stack: slot 0 at the bottom, TOP = size − 1. Push and pop touch only the top."
      visual={
        <div className="flex justify-center py-2">
          <div className="w-full max-w-xs">
            <ol aria-label={`Stack, ${s.items.length} items, bottom to top`} className="flex flex-col-reverse gap-1.5 rounded-b-md border-x-2 border-b-2 border-muted-foreground/60 px-2 pb-2 pt-6">
              {slots.map((item, i) => {
                const role = item ? roles[item.id] : undefined;
                const st = role ? ROLE[role] : null;
                return (
                  <li key={item ? item.id : `empty-${i}`} className="relative flex items-center">
                    <span className="w-14 shrink-0 pr-2 text-right font-mono text-[10px] text-muted-foreground sm:w-16">
                      {i === top ? <b className="text-foreground">TOP →</b> : `[${i}]`}
                    </span>
                    {item ? (
                      <span className={cn("flex h-9 flex-1 items-center justify-between rounded border-2 px-3 font-mono text-sm motion-safe:transition-all sm:h-10", st?.cls ?? "border-border bg-surface")}>
                        {item.value}
                        {st?.tag && <span className="text-[10px] font-sans font-semibold no-underline">{st.tag}</span>}
                      </span>
                    ) : (
                      <span className="flex h-9 flex-1 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground sm:h-10">{s.items.length === 0 && i === 0 ? "empty" : ""}</span>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-center text-xs text-muted-foreground">bottom · {s.items.length}/{s.capacity ?? `${MAX_STACK_ITEMS} max`}</p>
          </div>
        </div>
      }
      legend={
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          <LegendItem marker="+" label="Pushed" className="border-viz-active bg-viz-active/20" />
          <LegendItem marker="−" label="Popped (dashed)" className="border-dashed border-viz-swap" />
          <LegendItem marker="👁" label="Peeked" className="border-viz-compare" />
        </ul>
      }
      operations={
        <>
          <div className="space-y-1.5">
            <Label htmlFor="stack-value">Value, 0–999</Label>
            <Input id="stack-value" inputMode="numeric" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doPush()} aria-invalid={error ? true : undefined} aria-describedby="stack-help" />
            <p id="stack-help" className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>{error ?? "Enter pushes this value."}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={doPush}>Push</Button>
            <Button variant="outline" onClick={() => r.run(pop(r.committed))}>Pop</Button>
            <Button variant="outline" onClick={() => r.run(peek(r.committed))}>Peek</Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={() => r.run(push(r.committed, randomValues(1)[0]!))}>Push random</Button>
            <Button variant="secondary" onClick={() => r.replace(createStack(r.committed.capacity, randomValues(5)))}>Random fill</Button>
            <Button variant="secondary" onClick={() => r.run(clearStack(r.committed))}>Clear</Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="stack-bounded"
              checked={r.committed.capacity !== null}
              onCheckedChange={(on) => {
                const cap = on ? DEFAULT_STACK_CAPACITY : null;
                r.replace(createStack(cap, r.committed.items.slice(0, cap ?? MAX_STACK_ITEMS).map((i) => i.value)));
              }}
            />
            <Label htmlFor="stack-bounded" className="text-sm">Bounded (capacity {DEFAULT_STACK_CAPACITY})</Label>
          </div>
        </>
      }
      operationName={r.result?.operation ?? null}
      explanation={r.step?.explanation ?? null}
      status={r.step?.status ?? null}
      pseudocode={r.result?.pseudocode ?? null}
      codeLine={r.step?.codeLine}
      contents={{ label: "Bottom → top", text: s.items.length ? s.items.map((i) => i.value).join(", ") : "(empty)" }}
      stats={{
        ids: entry.stats.filter((id) => id !== "capacity" || s.capacity !== null),
        values: {
          step: r.steps.length ? `${r.player.index + 1}/${r.steps.length}` : "—",
          stackOps: r.step ? r.step.work : null,
          size: s.items.length,
          capacity: s.capacity,
          operations: s.operations,
        },
        labels: { stackOps: "Primitive ops (this op)", operations: "Completed ops" },
      }}
      complexity={entry.complexity}
      docs={entry.docs}
      docsName={entry.displayName}
      player={r.player}
      totalSteps={r.steps.length}
      speed={r.speed}
      onSpeedChange={r.setSpeed}
      note={<p className="text-xs text-muted-foreground">Limit: {limit} items.</p>}
    />
  );
}
