/**
 * Graph engine types. Free of React / DOM dependencies.
 */

export type NodeVisualState =
  "unvisited" | "discovered" | "queued" | "current" | "visited" | "path";

export type EdgeVisualState = "idle" | "considered" | "tree" | "relaxed" | "path";

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  /** Optional heuristic estimate to the target (informational). */
  heuristic?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  directed: boolean;
  weight: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type GraphStepType =
  | "init"
  | "enqueue"
  | "dequeue"
  | "push"
  | "pop"
  | "visit"
  | "check-edge"
  | "skip"
  | "relax"
  | "no-improve"
  | "finalize"
  | "path"
  | "done";

export interface GraphMetrics {
  /** Nodes finalized/visited so far. */
  visited: number;
  /** Edges examined so far. */
  edgeChecks: number;
  /** Frontier insertions so far (enqueue/push/heap insert). */
  frontierOps: number;
}

export interface FrontierEntry {
  id: string;
  /** Priority, for priority-queue based frontiers. */
  priority?: number;
}

export interface GraphStep {
  type: GraphStepType;
  explanation: string;
  metrics: GraphMetrics;
  nodeStates: Record<string, NodeVisualState>;
  edgeStates: Record<string, EdgeVisualState>;
  /** Snapshot of the frontier (queue front first / stack top last / heap sorted). */
  frontier: FrontierEntry[];
  /** Order in which nodes were visited/finalized. */
  order: string[];
  current: string | null;
  /** Dijkstra only: tentative distances (Infinity = unreached). */
  distances?: Record<string, number>;
  predecessors?: Record<string, string | null>;
  /** Final reconstructed path (node ids), when applicable. */
  path?: string[];
  codeLine?: number;
}

export interface GraphRunOptions {
  source: string;
  target?: string | null;
}

export type GraphStepGenerator = (graph: Graph, options: GraphRunOptions) => GraphStep[];

export interface GraphAlgorithmDefinition {
  id: "bfs" | "dfs" | "dijkstra";
  name: string;
  tagline: string;
  overview: string;
  implementation: string;
  pseudocode: string[];
  frontierLabel: string;
  complexity: { time: string; space: string; notes: string };
  usesWeights: boolean;
  usesTarget: boolean;
  generate: GraphStepGenerator;
}
