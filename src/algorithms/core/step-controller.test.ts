import { describe, expect, it } from "vitest";

import { StepController, type Scheduler } from "./step-controller";

function fakeScheduler() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const scheduler: Scheduler = {
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = ++seq;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout: (h) => void timers.delete(h as number),
  };
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].fn();
    }
    now = end;
  };
  return { scheduler, advance };
}

describe("StepController", () => {
  it("idle → playing → paused → resume → complete", () => {
    const { scheduler, advance } = fakeScheduler();
    const c = new StepController({ totalSteps: 5, intervalMs: 100, scheduler });
    expect(c.state).toBe("idle");
    c.start();
    expect(c.isPlaying).toBe(true);
    advance(250);
    expect(c.currentStep).toBe(2);
    c.pause();
    expect(c.isPaused).toBe(true);
    advance(1000);
    expect(c.currentStep).toBe(2);
    expect(c.getSnapshot().elapsedMs).toBe(250);
    c.resume();
    advance(200);
    expect(c.currentStep).toBe(4);
    expect(c.state).toBe("complete");
    expect(c.isPlaying).toBe(false);
  });

  it("next/previous clamp at the bounds", () => {
    const c = new StepController({ totalSteps: 3, scheduler: fakeScheduler().scheduler });
    c.previous();
    expect(c.currentStep).toBe(0);
    c.next();
    expect(c.state).toBe("paused");
    c.next();
    c.next();
    expect(c.currentStep).toBe(2);
    expect(c.state).toBe("complete");
    c.previous();
    expect(c.currentStep).toBe(1);
    expect(c.state).toBe("paused");
  });

  it("reset, complete, start from end, speed and load", () => {
    const { scheduler, advance } = fakeScheduler();
    const c = new StepController({ totalSteps: 4, intervalMs: 50, scheduler });
    c.complete();
    expect(c.currentStep).toBe(3);
    c.start(); // rewinds
    expect(c.currentStep).toBe(0);
    c.setSpeed(10);
    advance(10);
    expect(c.currentStep).toBe(1);
    c.reset();
    expect([c.currentStep, c.state]).toEqual([0, "idle"]);
    c.load(10);
    expect(c.totalSteps).toBe(10);
    c.goTo(99);
    expect(c.currentStep).toBe(9);
  });

  it("notifies subscribers with fresh snapshots", () => {
    const c = new StepController({ totalSteps: 3, scheduler: fakeScheduler().scheduler });
    const seen: number[] = [];
    const off = c.subscribe(() => seen.push(c.getSnapshot().currentStep));
    const first = c.getSnapshot();
    c.next();
    expect(c.getSnapshot()).not.toBe(first);
    off();
    c.next();
    expect(seen).toEqual([1]);
  });

  it("empty and single-step lists", () => {
    const c = new StepController({ totalSteps: 0, scheduler: fakeScheduler().scheduler });
    c.start();
    expect(c.state).toBe("idle");
    c.load(1);
    c.start();
    expect(c.state).toBe("complete");
  });
});
