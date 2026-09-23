/**
 * Statistic identifiers shared by every visualizer. Each algorithm declares
 * which ones it actually tracks; the UI renders only those, so nothing shows
 * a placeholder zero for a counter the algorithm never updates.
 */
export type StatId =
  | "step"
  | "comparisons"
  | "swaps"
  | "accesses"
  | "visited"
  | "processed"
  | "edgeChecks"
  | "frontierOps"
  | "queueOps"
  | "stackOps"
  | "treeComparisons"
  | "nodesVisited"
  | "size"
  | "capacity"
  | "height"
  | "operations"
  | "pathLength"
  | "explored"
  | "neighborChecks"
  | "elapsed"
  | "computeTime";

export const STAT_LABELS: Record<StatId, string> = {
  step: "Step",
  comparisons: "Comparisons",
  swaps: "Swaps",
  accesses: "Array accesses",
  visited: "Visited",
  processed: "Finalized",
  edgeChecks: "Edge traversals",
  frontierOps: "Frontier inserts",
  queueOps: "Queue ops",
  stackOps: "Stack ops",
  treeComparisons: "Comparisons",
  nodesVisited: "Nodes visited",
  size: "Size",
  capacity: "Capacity",
  height: "Height",
  operations: "Operations",
  pathLength: "Path length",
  explored: "Nodes explored",
  neighborChecks: "Neighbor checks",
  elapsed: "Elapsed",
  computeTime: "Compute time",
};

export type StatValue = number | string | null | undefined;
export type StatValues = Partial<Record<StatId, StatValue>>;

export function formatStat(id: StatId, value: StatValue): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (id === "elapsed") return `${(value / 1000).toFixed(1)}s`;
  if (id === "computeTime") return `${value.toFixed(2)}ms`;
  return String(value);
}

/** Pairs each declared stat with its label and formatted value, in order. */
export function resolveStats(
  ids: readonly StatId[],
  values: StatValues,
  labels: Partial<Record<StatId, string>> = {},
) {
  return ids.map((id) => ({
    id,
    label: labels[id] ?? STAT_LABELS[id],
    value: formatStat(id, values[id]),
  }));
}
