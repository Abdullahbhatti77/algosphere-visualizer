import { StepRecorder } from "../recorder";
import type { AlgorithmDefinition, AlgorithmStep } from "../types";

/** In-place quick sort using Lomuto partitioning with a last-element pivot. */
function generate(input: readonly number[]): AlgorithmStep[] {
  const r = new StepRecorder(input);
  const n = r.values.length;
  r.record("init", [], `Starting quick sort on ${n} element${n === 1 ? "" : "s"}.`, { codeLine: 0 });

  const partition = (lo: number, hi: number, depth: number): number => {
    const pivotValue = r.peek(hi);
    r.record("pivot", [hi], `Selecting ${pivotValue} at position ${hi} as the pivot.`, {
      pivot: hi,
      range: [lo, hi],
      depth,
      codeLine: 4,
    });

    let i = lo;
    for (let j = lo; j < hi; j += 1) {
      r.compare(j, hi, { pivot: hi, range: [lo, hi], depth, codeLine: 6 });
      if (r.peek(j) < pivotValue) {
        if (i !== j) {
          r.swap(i, j, { pivot: hi, range: [lo, hi], depth, codeLine: 7 });
        } else {
          r.record("select", [i], `${r.peek(j)} is already on the correct side of the pivot.`, {
            pivot: hi,
            range: [lo, hi],
            depth,
            codeLine: 7,
          });
        }
        i += 1;
      }
    }

    if (i !== hi) {
      r.swap(i, hi, { pivot: i, range: [lo, hi], depth, codeLine: 8 });
    }
    r.markSorted([i], `Pivot ${r.peek(i)} is now at its final position ${i}.`, {
      range: [lo, hi],
      depth,
      codeLine: 9,
    });
    return i;
  };

  const sort = (lo: number, hi: number, depth: number): void => {
    if (lo > hi) return;
    if (lo === hi) {
      r.markSorted([lo], `Single element ${r.peek(lo)} at position ${lo} is in place.`, {
        range: [lo, hi],
        depth,
        codeLine: 1,
      });
      return;
    }
    r.record("select", [lo, hi], `Partitioning positions ${lo}–${hi}.`, {
      range: [lo, hi],
      depth,
      codeLine: 2,
    });
    const p = partition(lo, hi, depth);
    sort(lo, p - 1, depth + 1);
    sort(p + 1, hi, depth + 1);
  };

  sort(0, n - 1, 0);
  return r.finish();
}

export const quickSort: AlgorithmDefinition = {
  id: "quick",
  name: "Quick Sort",
  category: "sorting",
  tagline: "Partition around a pivot, then recurse on both sides.",
  overview:
    "Quick sort picks a pivot, rearranges the range so smaller values sit left of it and larger values right of it, then recurses into both sides. The pivot lands in its final position after every partition, so no merge step is needed.",
  howItWorks: [
    "Choose the last element of the range as the pivot.",
    "Scan the range, moving every element smaller than the pivot to the front (Lomuto scheme).",
    "Swap the pivot into the boundary slot — it is now final.",
    "Recurse on the sub-ranges left and right of the pivot.",
  ],
  pseudocode: [
    "procedure quickSort(A, lo, hi)",
    "  if lo >= hi then return",
    "  p = partition(A, lo, hi)",
    "  quickSort(A, lo, p - 1); quickSort(A, p + 1, hi)",
    "procedure partition(A, lo, hi)",
    "  pivot = A[hi]; i = lo",
    "  for j = lo to hi - 1",
    "    if A[j] < pivot then swap(A[i], A[j]); i = i + 1",
    "  swap(A[i], A[hi])",
    "  return i",
  ],
  complexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n) average, O(n) worst",
    notes:
      "Partitioning is in place, so the only extra space is the recursion stack: O(log n) for balanced splits, degrading to O(n) in the worst case. Because this implementation always picks the last element as the pivot, an already-sorted or reverse-sorted input triggers the O(n²) worst case — randomised or median-of-three pivots avoid it. Heavy duplication is also a worst case here: with the strict < comparison, an all-equal array leaves every pivot at the left end, so each partition removes only one element (three-way partitioning would fix this). Best case O(n log n) assumes pivots split ranges evenly.",
  },
  practicalNotes: [
    "Fastest general-purpose comparison sort in practice thanks to cache-friendly in-place partitioning.",
    "Not stable: partition swaps move equal elements past one another.",
    "Production implementations randomise the pivot and switch to insertion sort on small ranges.",
  ],
  stable: false,
  inPlace: true,
  generate,
};
