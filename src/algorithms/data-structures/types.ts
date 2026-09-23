/** Shared shapes for data-structure operation traces (no React/DOM). */

export interface DSItem {
  id: number;
  value: number;
}

export type DSStatus =
  "ok" | "underflow" | "overflow" | "duplicate" | "not-found" | "invalid" | "full";

export interface DSStep<S, R extends string = string> {
  /** Snapshot of the structure after this step. */
  state: S;
  /** Item/node id → visual role. */
  roles: Record<number, R>;
  explanation: string;
  /** 0-based line in the operation's pseudocode. */
  codeLine: number;
  status: DSStatus;
  /** Primitive work counted within this operation so far. */
  work: number;
}

export interface DSOperationResult<S, R extends string = string> {
  operation: string;
  pseudocode: string[];
  steps: DSStep<S, R>[];
  state: S;
  status: DSStatus;
  /** Value produced (popped, dequeued, peeked, found). */
  value?: number;
}

export const DS_VALUE_MIN = 0;
export const DS_VALUE_MAX = 999;

export function isValidDSValue(value: number): boolean {
  return Number.isInteger(value) && value >= DS_VALUE_MIN && value <= DS_VALUE_MAX;
}

/** Parses "5, 3 8" into integers; returns an error message on bad input. */
export function parseDSValues(text: string, max: number): { values: number[] } | { error: string } {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return { error: "Enter at least one number." };
  if (parts.length > max) return { error: `At most ${max} values at a time.` };
  const values: number[] = [];
  for (const part of parts) {
    const n = Number(part);
    if (!isValidDSValue(n))
      return { error: `"${part}" is not a whole number from ${DS_VALUE_MIN} to ${DS_VALUE_MAX}.` };
    values.push(n);
  }
  return { values };
}

/** Deterministic PRNG (Mulberry32) so seeded random data is reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomValues(
  count: number,
  rand: () => number = Math.random,
  unique = false,
  max = 99,
): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  let guard = 0;
  while (out.length < count && guard++ < 10_000) {
    const v = 1 + Math.floor(rand() * max);
    if (unique && seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}
