export const MIN_ARRAY_SIZE = 5;
export const MAX_ARRAY_SIZE = 60;
export const MIN_VALUE = 5;
export const MAX_VALUE = 100;

/** Deterministic-shape random array generator (values 5..100). */
export function randomArray(size: number): number[] {
  const clamped = Math.min(MAX_ARRAY_SIZE, Math.max(MIN_ARRAY_SIZE, Math.round(size)));
  return Array.from(
    { length: clamped },
    () => MIN_VALUE + Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)),
  );
}

export interface ParseResult {
  values: number[] | null;
  error: string | null;
}

/** Parse a user-supplied comma/space separated list of positive integers. */
export function parseCustomValues(raw: string): ParseResult {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return { values: null, error: "Enter at least a few numbers, separated by commas." };
  }
  if (tokens.length > MAX_ARRAY_SIZE) {
    return { values: null, error: `Please enter at most ${MAX_ARRAY_SIZE} numbers.` };
  }

  const values: number[] = [];
  for (const token of tokens) {
    const value = Number(token);
    if (!Number.isFinite(value)) {
      return { values: null, error: `"${token}" is not a number.` };
    }
    if (!Number.isInteger(value)) {
      return { values: null, error: `"${token}" is not a whole number.` };
    }
    if (value < 1 || value > 999) {
      return { values: null, error: `Values must be between 1 and 999 ("${token}").` };
    }
    values.push(value);
  }

  return { values, error: null };
}
