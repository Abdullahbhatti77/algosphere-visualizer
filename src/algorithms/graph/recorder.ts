import type {
  EdgeVisualState,
  FrontierEntry,
  Graph,
  GraphMetrics,
  GraphStep,
  GraphStepType,
  NodeVisualState,
} from "./types";

/** Mutable working state that algorithms update; `emit` snapshots it. */
export class GraphRecorder {
  readonly steps: GraphStep[] = [];
  nodeStates: Record<string, NodeVisualState> = {};
  edgeStates: Record<string, EdgeVisualState> = {};
  metrics: GraphMetrics = { visited: 0, edgeChecks: 0, frontierOps: 0 };
  frontier: FrontierEntry[] = [];
  order: string[] = [];
  current: string | null = null;
  distances?: Record<string, number>;
  predecessors?: Record<string, string | null>;
  path?: string[];

  constructor(graph: Graph) {
    for (const n of graph.nodes) this.nodeStates[n.id] = "unvisited";
    for (const e of graph.edges) this.edgeStates[e.id] = "idle";
  }

  emit(type: GraphStepType, explanation: string, codeLine?: number): void {
    const step: GraphStep = {
      type,
      explanation,
      metrics: { ...this.metrics },
      nodeStates: { ...this.nodeStates },
      edgeStates: { ...this.edgeStates },
      frontier: this.frontier.map((f) => ({ ...f })),
      order: [...this.order],
      current: this.current,
    };
    if (this.distances) step.distances = { ...this.distances };
    if (this.predecessors) step.predecessors = { ...this.predecessors };
    if (this.path) step.path = [...this.path];
    if (codeLine !== undefined) step.codeLine = codeLine;
    this.steps.push(step);
  }
}

export function formatDistance(d: number | undefined): string {
  return d === undefined || d === Infinity ? "∞" : String(d);
}
