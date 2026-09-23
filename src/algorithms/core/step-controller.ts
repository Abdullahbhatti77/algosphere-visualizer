/**
 * Framework-agnostic playback state machine over a pre-computed step list.
 *
 * It knows nothing about what a step means — only a cursor, a status, a speed
 * and a clock. Timing goes through an injectable scheduler so the machine can
 * be driven by a fake clock in tests. UI layers subscribe for changes.
 */

export type PlaybackStatus = "idle" | "playing" | "paused" | "complete";

export interface Scheduler {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  now: () => number;
}

export const realScheduler: Scheduler = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
  now: () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
};

export interface StepControllerSnapshot {
  currentStep: number;
  totalSteps: number;
  status: PlaybackStatus;
  isPlaying: boolean;
  isPaused: boolean;
  isComplete: boolean;
  /** Playback interval in milliseconds. */
  speed: number;
  elapsedMs: number;
}

export interface StepControllerOptions {
  totalSteps?: number;
  intervalMs?: number;
  scheduler?: Scheduler;
  /** How often the elapsed clock is re-published while playing. */
  clockTickMs?: number;
}

export class StepController {
  private index = 0;
  private total: number;
  private status: PlaybackStatus = "idle";
  private interval: number;
  private readonly scheduler: Scheduler;
  private readonly clockTickMs: number;
  private stepTimer: unknown = null;
  private clockTimer: unknown = null;
  private runStart: number | null = null;
  private accumulated = 0;
  private listeners = new Set<() => void>();
  private snapshot: StepControllerSnapshot;

  constructor(options: StepControllerOptions = {}) {
    this.total = Math.max(0, options.totalSteps ?? 0);
    this.interval = options.intervalMs ?? 180;
    this.scheduler = options.scheduler ?? realScheduler;
    this.clockTickMs = options.clockTickMs ?? 100;
    this.snapshot = this.buildSnapshot();
  }

  // ---- observation -------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): StepControllerSnapshot => this.snapshot;

  get currentStep() { return this.index; }
  get totalSteps() { return this.total; }
  get isPlaying() { return this.status === "playing"; }
  get isPaused() { return this.status === "paused"; }
  get speed() { return this.interval; }
  get state() { return this.status; }

  private get lastIndex() {
    return Math.max(0, this.total - 1);
  }

  private elapsedNow(): number {
    const running = this.runStart === null ? 0 : this.scheduler.now() - this.runStart;
    return this.accumulated + running;
  }

  private buildSnapshot(): StepControllerSnapshot {
    return {
      currentStep: this.index,
      totalSteps: this.total,
      status: this.status,
      isPlaying: this.status === "playing",
      isPaused: this.status === "paused",
      isComplete: this.status === "complete",
      speed: this.interval,
      elapsedMs: this.elapsedNow(),
    };
  }

  private emit() {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }

  // ---- timers ------------------------------------------------------------

  private clearTimers() {
    if (this.stepTimer !== null) this.scheduler.clearTimeout(this.stepTimer);
    if (this.clockTimer !== null) this.scheduler.clearTimeout(this.clockTimer);
    this.stepTimer = null;
    this.clockTimer = null;
  }

  private stopClock() {
    if (this.runStart !== null) {
      this.accumulated += this.scheduler.now() - this.runStart;
      this.runStart = null;
    }
  }

  private resetClock() {
    this.accumulated = 0;
    this.runStart = null;
  }

  private scheduleStep() {
    this.stepTimer = this.scheduler.setTimeout(() => {
      this.stepTimer = null;
      if (this.status !== "playing") return;
      this.index = Math.min(this.lastIndex, this.index + 1);
      if (this.index >= this.lastIndex) {
        this.finish();
        return;
      }
      this.scheduleStep();
      this.emit();
    }, this.interval);
  }

  private scheduleClock() {
    this.clockTimer = this.scheduler.setTimeout(() => {
      this.clockTimer = null;
      if (this.status !== "playing") return;
      this.emit();
      this.scheduleClock();
    }, this.clockTickMs);
  }

  private finish() {
    this.clearTimers();
    this.stopClock();
    this.index = this.lastIndex;
    this.status = "complete";
    this.emit();
  }

  /** Status after a manual cursor move. */
  private settle() {
    this.clearTimers();
    this.stopClock();
    if (this.total > 0 && this.index >= this.lastIndex) this.status = "complete";
    else this.status = this.index === 0 && this.accumulated === 0 ? "idle" : "paused";
  }

  // ---- commands ----------------------------------------------------------

  /** Replace the step list; resets cursor, status and clock. */
  load(totalSteps: number) {
    this.clearTimers();
    this.total = Math.max(0, totalSteps);
    this.index = 0;
    this.status = "idle";
    this.resetClock();
    this.emit();
  }

  setSpeed(intervalMs: number) {
    this.interval = Math.max(1, intervalMs);
    if (this.status === "playing") {
      if (this.stepTimer !== null) this.scheduler.clearTimeout(this.stepTimer);
      this.scheduleStep();
    }
    this.emit();
  }

  /** Begin playing. From the final step it rewinds to the start first. */
  start() {
    if (this.total <= 1) {
      if (this.total === 1) this.finish();
      return;
    }
    if (this.status === "playing") return;
    if (this.index >= this.lastIndex) {
      this.index = 0;
      this.resetClock();
    }
    this.status = "playing";
    this.runStart = this.scheduler.now();
    this.scheduleStep();
    this.scheduleClock();
    this.emit();
  }

  pause() {
    if (this.status !== "playing") return;
    this.clearTimers();
    this.stopClock();
    this.status = "paused";
    this.emit();
  }

  /** Continue from a pause without rewinding. */
  resume() {
    if (this.status !== "paused") return;
    this.start();
  }

  toggle() {
    if (this.status === "playing") this.pause();
    else this.start();
  }

  next() {
    if (this.total === 0) return;
    this.index = Math.min(this.lastIndex, this.index + 1);
    this.settle();
    this.emit();
  }

  previous() {
    if (this.total === 0) return;
    this.index = Math.max(0, this.index - 1);
    this.settle();
    this.emit();
  }

  goTo(target: number) {
    if (this.total === 0) return;
    this.index = Math.min(this.lastIndex, Math.max(0, Math.round(target)));
    this.settle();
    this.emit();
  }

  /** Back to step 0, idle, clock cleared. */
  reset() {
    this.clearTimers();
    this.index = 0;
    this.status = "idle";
    this.resetClock();
    this.emit();
  }

  /** Jump straight to the final step. */
  complete() {
    if (this.total === 0) return;
    this.finish();
  }

  dispose() {
    this.clearTimers();
    this.stopClock();
    if (this.status === "playing") this.status = "paused";
  }
}
