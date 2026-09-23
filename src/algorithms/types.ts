/**
 * Core algorithm-engine types.
 *
 * This module (and everything under `src/algorithms`) is deliberately free of
 * any React / DOM dependency: algorithms produce plain, serialisable step
 * records and the UI merely renders them.
 */

/** Discrete operation kinds a sorting algorithm can report. */
export type SortStepType =
  | "init"
  | "compare"
  | "swap"
  | "overwrite"
  | "pivot"
  | "heapify"
  | "select"
  | "mark-sorted"
  | "done";

export interface StepMetrics {
  /** Element-to-element comparisons performed so far. */
  comparisons: number;
  /** Element swaps performed so far. */
  swaps: number;
  /** Individual array reads + writes performed so far. */
  accesses: number;
}

export interface StepMeta {
  /** Index of the current pivot, when the algorithm uses one. */
  pivot?: number;
  /** Inclusive range the algorithm is currently working on. */
  range?: [number, number];
  /** Recursion / heap depth, when meaningful. */
  depth?: number;
  /** 0-based line of the algorithm's pseudocode this step maps to. */
  codeLine?: number;
}

/**
 * A single observable state transition of an algorithm.
 *
 * `values` is a full snapshot so the visualiser never has to replay mutations,
 * which keeps stepping backwards trivial and exact.
 */
export interface AlgorithmStep {
  type: SortStepType;
  /** Indices the step acts on (comparison pair, swap pair, write target...). */
  indices: number[];
  /** Snapshot of the working array after this step was applied. */
  values: number[];
  /** Indices already in their final sorted position. */
  sorted: number[];
  metrics: StepMetrics;
  /** Short human-readable description of exactly what happened. */
  explanation: string;
  meta?: StepMeta;
}

/** A pure step generator: same input always yields the same step list. */
export type SortStepGenerator = (input: readonly number[]) => AlgorithmStep[];

export interface ComplexityInfo {
  best: string;
  average: string;
  worst: string;
  space: string;
  /** Assumptions behind the stated bounds (e.g. recursion strategy). */
  notes: string;
}

export interface AlgorithmDefinition {
  id: string;
  name: string;
  category: "sorting";
  tagline: string;
  overview: string;
  howItWorks: string[];
  pseudocode: string[];
  complexity: ComplexityInfo;
  practicalNotes: string[];
  stable: boolean;
  inPlace: boolean;
  generate: SortStepGenerator;
}
