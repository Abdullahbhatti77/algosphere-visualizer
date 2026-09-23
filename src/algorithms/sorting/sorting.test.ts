import { describe, expect, it } from "vitest";

import { sortingAlgorithms } from "../registry";

const CASES: Record<string, number[]> = {
  random: [42, 7, 19, 3, 88, 11, 56, 4, 61, 25],
  duplicates: [5, 3, 5, 1, 3, 5, 1],
  sorted: [1, 2, 3, 4, 5, 6, 7, 8],
  reversed: [9, 8, 7, 6, 5, 4, 3, 2, 1],
  single: [7],
  empty: [],
  twoEqual: [4, 4],
};

describe.each(sortingAlgorithms.map((a) => [a.name, a] as const))("%s", (_name, algorithm) => {
  for (const [label, input] of Object.entries(CASES)) {
    it(`sorts the ${label} input correctly`, () => {
      const steps = algorithm.generate(input);
      const expected = [...input].sort((a, b) => a - b);
      expect(steps.at(-1)?.values).toEqual(expected);
    });
  }

  it("is deterministic for identical input", () => {
    const first = algorithm.generate(CASES.random!);
    const second = algorithm.generate(CASES.random!);
    expect(second.length).toBe(first.length);
    expect(second).toEqual(first);
  });

  it("emits a terminal done step with everything marked sorted", () => {
    const steps = algorithm.generate(CASES.random!);
    const last = steps.at(-1)!;
    expect(last.type).toBe("done");
    expect(last.sorted).toHaveLength(CASES.random!.length);
  });

  it("never reports decreasing metrics", () => {
    const steps = algorithm.generate(CASES.reversed!);
    for (let i = 1; i < steps.length; i += 1) {
      const previous = steps[i - 1]!.metrics;
      const current = steps[i]!.metrics;
      expect(current.comparisons).toBeGreaterThanOrEqual(previous.comparisons);
      expect(current.swaps).toBeGreaterThanOrEqual(previous.swaps);
      expect(current.accesses).toBeGreaterThanOrEqual(previous.accesses);
    }
  });

  // Only meaningful for in-place algorithms: merge sort legitimately holds a
  // partially overwritten range while copying from its temporary buffers.
  it.skipIf(!algorithm.inPlace)("preserves the multiset of values in every snapshot", () => {
    const steps = algorithm.generate(CASES.duplicates!);
    const expected = [...CASES.duplicates!].sort((a, b) => a - b);
    for (const step of steps) {
      expect([...step.values].sort((a, b) => a - b)).toEqual(expected);
    }
  });
});

