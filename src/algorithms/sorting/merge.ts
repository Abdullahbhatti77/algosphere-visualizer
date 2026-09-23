import { StepRecorder } from "../recorder";
import type { AlgorithmDefinition, AlgorithmStep } from "../types";

/**
 * Top-down merge sort. Merges write back into the single working array so the
 * visualised bars always reflect real algorithm state.
 */
function generate(input: readonly number[]): AlgorithmStep[] {
  const r = new StepRecorder(input);
  const n = r.values.length;
  r.record("init", [], `Starting merge sort on ${n} element${n === 1 ? "" : "s"}.`, { codeLine: 0 });

  const sort = (lo: number, hi: number, depth: number): void => {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    r.record("select", [lo, hi], `Splitting positions ${lo}–${hi} at ${mid}.`, {
      range: [lo, hi],
      depth,
      codeLine: 2,
    });

    sort(lo, mid, depth + 1);
    sort(mid + 1, hi, depth + 1);

    r.record("select", [lo, hi], `Merging sorted runs ${lo}–${mid} and ${mid + 1}–${hi}.`, {
      range: [lo, hi],
      depth,
      codeLine: 5,
    });

    const left = r.values.slice(lo, mid + 1);
    const right = r.values.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;

    while (i < left.length && j < right.length) {
      r.countComparison();
      const takeLeft = left[i]! <= right[j]!;
      const value = takeLeft ? left[i++]! : right[j++]!;
      r.write(
        k,
        value,
        `Taking ${value} from the ${takeLeft ? "left" : "right"} run into position ${k}.`,
        { range: [lo, hi], depth, codeLine: 6 },
      );
      k += 1;
    }
    while (i < left.length) {
      const value = left[i++]!;
      r.write(k, value, `Copying remaining ${value} from the left run into position ${k}.`, {
        range: [lo, hi],
        depth,
        codeLine: 7,
      });
      k += 1;
    }
    while (j < right.length) {
      const value = right[j++]!;
      r.write(k, value, `Copying remaining ${value} from the right run into position ${k}.`, {
        range: [lo, hi],
        depth,
        codeLine: 7,
      });
      k += 1;
    }

    if (lo === 0 && hi === n - 1) return;
    r.record("mark-sorted", [lo, hi], `Positions ${lo}–${hi} are now a single sorted run.`, {
      range: [lo, hi],
      depth,
      codeLine: 8,
    });
  };

  sort(0, n - 1, 0);
  return r.finish();
}

export const mergeSort: AlgorithmDefinition = {
  id: "merge",
  name: "Merge Sort",
  category: "sorting",
  tagline: "Divide the array, sort halves, merge the runs.",
  overview:
    "Merge sort recursively halves the array until each piece holds a single element, then merges neighbouring sorted runs back together. Because merging is linear and the recursion is logarithmically deep, the running time is O(n log n) on every input.",
  howItWorks: [
    "Split the current range at its midpoint.",
    "Recursively sort the left half, then the right half.",
    "Merge the two sorted runs by repeatedly taking the smaller front element.",
    "Write merged values back into the original range before returning.",
  ],
  pseudocode: [
    "procedure mergeSort(A, lo, hi)",
    "  if lo >= hi then return",
    "  mid = floor((lo + hi) / 2)",
    "  mergeSort(A, lo, mid)",
    "  mergeSort(A, mid + 1, hi)",
    "  left = A[lo..mid]; right = A[mid+1..hi]",
    "  while both runs non-empty: A[k++] = smaller front element",
    "  copy any remaining elements",
    "  A[lo..hi] is now sorted",
  ],
  complexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(n)",
    notes:
      "This implementation copies each range into temporary left/right buffers before merging, so auxiliary space is O(n) plus O(log n) recursion stack. Comparison count is input-dependent but the bound never degrades.",
  },
  practicalNotes: [
    "Predictable performance makes it the default for external sorting and linked lists.",
    "Stable: ties take from the left run first (`<=`).",
    "The extra buffer is its main cost; in-place merge variants trade time for space.",
  ],
  stable: true,
  inPlace: false,
  generate,
};
