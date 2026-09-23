import { StepRecorder } from "../recorder";
import type { AlgorithmDefinition, AlgorithmStep } from "../types";

/** Bubble sort with early termination when a full pass makes no swaps. */
function generate(input: readonly number[]): AlgorithmStep[] {
  const r = new StepRecorder(input);
  const n = r.values.length;
  r.record("init", [], `Starting bubble sort on ${n} element${n === 1 ? "" : "s"}.`, {
    codeLine: 0,
  });

  for (let pass = 0; pass < n - 1; pass += 1) {
    let swapped = false;
    r.record("select", [], `Pass ${pass + 1}: bubbling the largest remaining value to the right.`, {
      range: [0, n - pass - 1],
      codeLine: 1,
    });

    for (let i = 0; i < n - pass - 1; i += 1) {
      r.compare(i, i + 1, { range: [0, n - pass - 1], codeLine: 3 });
      if (r.peek(i) > r.peek(i + 1)) {
        r.swap(i, i + 1, { range: [0, n - pass - 1], codeLine: 4 });
        swapped = true;
      }
    }

    r.markSorted(
      [n - pass - 1],
      `Position ${n - pass - 1} now holds ${r.peek(n - pass - 1)} and is final.`,
      { codeLine: 5 },
    );

    if (!swapped) {
      r.markSortedSilently(Array.from({ length: n - pass - 1 }, (_, i) => i));
      r.record("mark-sorted", [], "No swaps in this pass — the array is already ordered.", {
        codeLine: 6,
      });
      break;
    }
  }

  if (n > 0) r.markSortedSilently([0]);
  return r.finish();
}

export const bubbleSort: AlgorithmDefinition = {
  id: "bubble",
  name: "Bubble Sort",
  category: "sorting",
  tagline: "Repeatedly swap adjacent out-of-order pairs.",
  overview:
    "Bubble sort walks the array comparing neighbouring elements and swapping them when they are out of order. Each pass pushes the largest remaining value to the end of the unsorted region, so after k passes the last k positions are final.",
  howItWorks: [
    "Compare each adjacent pair from left to right across the unsorted region.",
    "Swap the pair whenever the left value is greater than the right one.",
    "After a pass, the largest value in that region has bubbled to its final slot.",
    "Shrink the region by one and repeat; stop early if a pass performs no swaps.",
  ],
  pseudocode: [
    "procedure bubbleSort(A)",
    "  for pass = 0 to n - 2",
    "    swapped = false",
    "    for i = 0 to n - pass - 2",
    "      if A[i] > A[i + 1] then swap(A[i], A[i + 1]); swapped = true",
    "    mark A[n - pass - 1] as sorted",
    "    if not swapped then return",
  ],
  complexity: {
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    notes:
      "The O(n) best case relies on the early-exit flag implemented here: an already-sorted array finishes after a single comparison pass. Sorting happens in place, so only a constant number of temporaries is needed.",
  },
  practicalNotes: [
    "Never used for real workloads — quadratic comparisons dominate quickly.",
    "Stable: equal elements keep their relative order because only strict `>` triggers a swap.",
    "Useful as a teaching tool and for tiny, nearly-sorted arrays where the early exit wins.",
  ],
  stable: true,
  inPlace: true,
  generate,
};
