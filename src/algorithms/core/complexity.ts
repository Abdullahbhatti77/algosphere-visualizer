export type AlgorithmCategory = "sorting" | "graph" | "pathfinding" | "data-structure";

export interface OperationComplexity {
  operation: string;
  average: string;
  worst: string;
}

/** Complexity metadata; one card renders any of these. */
export interface ComplexityMeta {
  name: string;
  category: AlgorithmCategory;
  bestTime: string;
  averageTime: string;
  worstTime: string;
  space: string;
  stable?: boolean;
  inPlace?: boolean;
  description: string;
  assumptions: string[];
  /** Per-operation bounds (data structures). */
  operations?: OperationComplexity[];
  /** Symbol definitions such as "V = rows × cols". */
  notation?: { symbol: string; meaning: string }[];
}

const BIG_O = /^O\(.+\)$/;

export function isBigO(value: string): boolean {
  if (!BIG_O.test(value)) return false;
  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/** Returns a list of problems; an empty list means the metadata is valid. */
export function validateComplexity(meta: ComplexityMeta): string[] {
  const problems: string[] = [];
  if (!meta.name.trim()) problems.push("missing name");
  if (!meta.description.trim()) problems.push(`${meta.name}: missing description`);
  if (meta.assumptions.length === 0) problems.push(`${meta.name}: no assumptions stated`);
  for (const key of ["bestTime", "averageTime", "worstTime", "space"] as const) {
    if (!isBigO(meta[key])) problems.push(`${meta.name}: ${key} "${meta[key]}" is not Big-O`);
  }
  for (const op of meta.operations ?? []) {
    if (!isBigO(op.average) || !isBigO(op.worst)) problems.push(`${meta.name}: ${op.operation} bounds invalid`);
  }
  return problems;
}
