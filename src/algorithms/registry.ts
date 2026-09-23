import { bubbleSort } from "./sorting/bubble";
import { heapSort } from "./sorting/heap";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import type { AlgorithmDefinition } from "./types";

export const sortingAlgorithms: AlgorithmDefinition[] = [
  bubbleSort,
  mergeSort,
  quickSort,
  heapSort,
];

export type SortingAlgorithmId = (typeof sortingAlgorithms)[number]["id"];

export function getSortingAlgorithm(id: string): AlgorithmDefinition {
  return sortingAlgorithms.find((algorithm) => algorithm.id === id) ?? bubbleSort;
}
