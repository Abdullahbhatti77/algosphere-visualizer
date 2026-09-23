import type { ComponentType } from "react";

import type { VisualizerKey } from "@/algorithms/core/catalog";

import { BSTVisualizer } from "./bst-visualizer";
import { QueueVisualizer } from "./queue-visualizer";
import { StackVisualizer } from "./stack-visualizer";

/** UI-side map from catalogue visualizer keys to components. */
export const dataStructureVisualizers: Partial<Record<VisualizerKey, ComponentType>> = {
  bst: BSTVisualizer,
  stack: StackVisualizer,
  queue: QueueVisualizer,
};
