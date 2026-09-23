import { StepRecorder } from "../recorder";
import type { AlgorithmDefinition, AlgorithmStep } from "../types";

/** Classic in-place heap sort: build a max-heap, then extract the root n-1 times. */
function generate(input: readonly number[]): AlgorithmStep[] {
  const r = new StepRecorder(input);
  const n = r.values.length;
  r.record("init", [], `Starting heap sort on ${n} element${n === 1 ? "" : "s"}.`, { codeLine: 0 });

  const siftDown = (root: number, end: number, depth: number): void => {
    let largest = root;
    r.record("heapify", [root], `Heapifying the subtree rooted at index ${root}.`, {
      range: [0, end - 1],
      depth,
      codeLine: 6,
    });

    for (;;) {
      const left = 2 * largest + 1;
      const right = left + 1;
      let next = largest;

      if (left < end) {
        r.compare(left, next, { range: [0, end - 1], depth, codeLine: 7 });
        if (r.peek(left) > r.peek(next)) next = left;
      }
      if (right < end) {
        r.compare(right, next, { range: [0, end - 1], depth, codeLine: 8 });
        if (r.peek(right) > r.peek(next)) next = right;
      }
      if (next === largest) {
        r.record("select", [largest], `Heap property holds at index ${largest}.`, {
          range: [0, end - 1],
          depth,
          codeLine: 9,
        });
        return;
      }
      r.swap(largest, next, { range: [0, end - 1], depth, codeLine: 10 });
      largest = next;
    }
  };

  r.record("select", [], "Building a max-heap from the bottom up.", { codeLine: 1 });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) siftDown(i, n, 0);
  if (n > 1) {
    r.record("select", [0], `Max-heap ready — the largest value ${r.peek(0)} sits at the root.`, {
      codeLine: 2,
    });
  }

  for (let end = n - 1; end > 0; end -= 1) {
    r.swap(0, end, { range: [0, end], codeLine: 3 });
    r.markSorted([end], `Position ${end} now holds ${r.peek(end)} and is final.`, { codeLine: 4 });
    siftDown(0, end, 0);
  }

  if (n > 0) r.markSortedSilently([0]);
  return r.finish();
}

export const heapSort: AlgorithmDefinition = {
  id: "heap",
  name: "Heap Sort",
  category: "sorting",
  tagline: "Build a max-heap, then repeatedly extract the maximum.",
  overview:
    "Heap sort treats the array as a binary max-heap. After building the heap in linear time, it swaps the root with the last unsorted slot and sifts the new root down, growing a sorted suffix one element per iteration.",
  howItWorks: [
    "Sift down every internal node from the bottom up to build a max-heap.",
    "Swap the root (the maximum) with the last element of the heap region.",
    "Shrink the heap region by one — that position is now final.",
    "Sift the new root down to restore the heap property, and repeat.",
  ],
  pseudocode: [
    "procedure heapSort(A)",
    "  for i = floor(n/2) - 1 down to 0: siftDown(A, i, n)",
    "  // A is now a max-heap",
    "  for end = n - 1 down to 1",
    "    swap(A[0], A[end])   // A[end] is final",
    "    siftDown(A, 0, end)",
    "procedure siftDown(A, root, end)",
    "  largest = root",
    "  compare with left and right children",
    "  if largest == root then return",
    "  swap and continue down",
  ],
  complexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(1)",
    notes:
      "Space is O(1) because this is the standard in-place implementation with an iterative sift-down (no recursion stack). Build-heap is O(n); the n-1 extractions each cost O(log n).",
  },
  practicalNotes: [
    "Guaranteed O(n log n) with no extra memory — valuable for worst-case-sensitive systems.",
    "Not stable: sift-down swaps reorder equal elements.",
    "Poorer cache locality than quick sort, so it is usually slower in practice despite equal asymptotics.",
  ],
  stable: false,
  inPlace: true,
  generate,
};
