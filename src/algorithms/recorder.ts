import type { AlgorithmStep, SortStepType, StepMeta } from "./types";

/**
 * Small helper used by every sorting implementation to record state
 * transitions while it mutates its working array.
 *
 * The recorder owns the metrics counters so each algorithm reports
 * comparisons / swaps / accesses consistently.
 */
export class StepRecorder {
  readonly values: number[];
  private readonly steps: AlgorithmStep[] = [];
  private readonly sortedSet = new Set<number>();
  private comparisons = 0;
  private swaps = 0;
  private accesses = 0;

  constructor(input: readonly number[]) {
    this.values = [...input];
  }

  /** Record a step without changing any counters. */
  record(type: SortStepType, indices: number[], explanation: string, meta?: StepMeta): void {
    this.steps.push({
      type,
      indices,
      values: [...this.values],
      sorted: [...this.sortedSet].sort((a, b) => a - b),
      metrics: {
        comparisons: this.comparisons,
        swaps: this.swaps,
        accesses: this.accesses,
      },
      explanation,
      ...(meta ? { meta } : {}),
    });
  }

  /** Read an element, counting one array access. */
  read(index: number): number {
    this.accesses += 1;
    return this.values[index]!;
  }

  /** Peek at an element without counting an access (for explanations only). */
  peek(index: number): number {
    return this.values[index]!;
  }

  /** Count a comparison between two indices and record it. */
  compare(i: number, j: number, meta?: StepMeta): void {
    this.comparisons += 1;
    this.accesses += 2;
    this.record(
      "compare",
      [i, j],
      `Comparing positions ${i} and ${j} (${this.peek(i)} vs ${this.peek(j)}).`,
      meta,
    );
  }

  /** Swap two elements and record it. */
  swap(i: number, j: number, meta?: StepMeta): void {
    const a = this.values[i]!;
    const b = this.values[j]!;
    this.values[i] = b;
    this.values[j] = a;
    this.swaps += 1;
    this.accesses += 4;
    this.record("swap", [i, j], `Swapping ${a} and ${b} at positions ${i} and ${j}.`, meta);
  }

  /** Write a value into a slot (used by merge sort) and record it. */
  write(index: number, value: number, explanation?: string, meta?: StepMeta): void {
    const previous = this.values[index]!;
    this.values[index] = value;
    this.accesses += 1;
    this.record(
      "overwrite",
      [index],
      explanation ?? `Writing ${value} into position ${index} (was ${previous}).`,
      meta,
    );
  }

  /** Count a comparison without emitting a dedicated compare step. */
  countComparison(reads = 2): void {
    this.comparisons += 1;
    this.accesses += reads;
  }

  markSorted(indices: number[], explanation: string, meta?: StepMeta): void {
    for (const index of indices) this.sortedSet.add(index);
    this.record("mark-sorted", indices, explanation, meta);
  }

  markSortedSilently(indices: number[]): void {
    for (const index of indices) this.sortedSet.add(index);
  }

  finish(explanation = "Array is fully sorted."): AlgorithmStep[] {
    for (let i = 0; i < this.values.length; i += 1) this.sortedSet.add(i);
    this.record("done", [], explanation);
    return this.steps;
  }
}
