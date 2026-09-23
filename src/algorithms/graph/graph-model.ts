import type { Graph, GraphEdge, GraphNode } from "./types";

export const MAX_NODES = 26;
export const MAX_WEIGHT = 999;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function emptyGraph(): Graph {
  return { nodes: [], edges: [] };
}

/** Next free single-letter label (A–Z). */
export function nextLabel(graph: Graph): string | null {
  const used = new Set(graph.nodes.map((n) => n.label));
  for (let i = 0; i < 26; i++) {
    const label = String.fromCharCode(65 + i);
    if (!used.has(label)) return label;
  }
  return null;
}

export function addNode(graph: Graph, x: number, y: number): Result<Graph> {
  if (graph.nodes.length >= MAX_NODES) {
    return { ok: false, error: `Graphs are limited to ${MAX_NODES} nodes (labels A–Z).` };
  }
  const label = nextLabel(graph);
  if (!label) return { ok: false, error: "No free node labels remain." };
  const node: GraphNode = { id: label, label, x, y };
  return { ok: true, value: { ...graph, nodes: [...graph.nodes, node] } };
}

export function moveNode(graph: Graph, id: string, x: number, y: number): Graph {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) };
}

export function removeNode(graph: Graph, id: string): Graph {
  return {
    nodes: graph.nodes.filter((n) => n.id !== id),
    edges: graph.edges.filter((e) => e.source !== id && e.target !== id),
  };
}

export function removeEdge(graph: Graph, id: string): Graph {
  return { ...graph, edges: graph.edges.filter((e) => e.id !== id) };
}

export function validateWeight(weight: number): string | null {
  if (!Number.isFinite(weight)) return "Weight must be a finite number.";
  if (weight < 0) {
    return "Negative weights are not allowed: Dijkstra permanently finalizes the closest node, which is only correct if no later edge can make a path shorter.";
  }
  if (weight > MAX_WEIGHT) return `Weight must be at most ${MAX_WEIGHT}.`;
  return null;
}

/** Whether an edge between a and b already exists, respecting direction. */
export function findDuplicate(graph: Graph, source: string, target: string, directed: boolean): GraphEdge | undefined {
  return graph.edges.find((e) => {
    const same = e.source === source && e.target === target;
    const reverse = e.source === target && e.target === source;
    // An undirected edge on either side covers both directions.
    if (!directed || !e.directed) return same || reverse;
    return same;
  });
}

export function validateEdge(
  graph: Graph,
  source: string,
  target: string,
  directed: boolean,
  weight: number,
): string | null {
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (!ids.has(source) || !ids.has(target)) return "Both endpoints must be existing nodes.";
  if (source === target) return "Self-loops are not supported.";
  const dup = findDuplicate(graph, source, target, directed);
  if (dup) return `An edge between ${source} and ${target} already exists.`;
  return validateWeight(weight);
}

export function addEdge(
  graph: Graph,
  source: string,
  target: string,
  directed: boolean,
  weight = 1,
): Result<Graph> {
  const error = validateEdge(graph, source, target, directed, weight);
  if (error) return { ok: false, error };
  const edge: GraphEdge = {
    id: `${source}${directed ? ">" : "-"}${target}`,
    source,
    target,
    directed,
    weight,
  };
  return { ok: true, value: { ...graph, edges: [...graph.edges, edge] } };
}

export function setEdgeWeight(graph: Graph, id: string, weight: number): Result<Graph> {
  const error = validateWeight(weight);
  if (error) return { ok: false, error };
  return { ok: true, value: { ...graph, edges: graph.edges.map((e) => (e.id === id ? { ...e, weight } : e)) } };
}

export function setAllDirected(graph: Graph, directed: boolean): Graph {
  if (directed) return { ...graph, edges: graph.edges.map((e) => ({ ...e, directed: true, id: `${e.source}>${e.target}` })) };
  // Converting to undirected: collapse opposite pairs, keeping the first (lower weight wins).
  const kept: GraphEdge[] = [];
  for (const e of graph.edges) {
    const other = kept.find((k) => (k.source === e.target && k.target === e.source) || (k.source === e.source && k.target === e.target));
    if (other) {
      other.weight = Math.min(other.weight, e.weight);
      continue;
    }
    kept.push({ ...e, directed: false, id: `${e.source}-${e.target}` });
  }
  return { ...graph, edges: kept };
}

export interface Neighbor {
  node: string;
  edge: GraphEdge;
}

/**
 * Adjacency lists with neighbours sorted by label, so traversals are
 * deterministic regardless of edge insertion order.
 */
export function buildAdjacency(graph: Graph): Map<string, Neighbor[]> {
  const adj = new Map<string, Neighbor[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  const labelOf = new Map(graph.nodes.map((n) => [n.id, n.label]));
  for (const e of graph.edges) {
    if (!adj.has(e.source) || !adj.has(e.target)) continue;
    adj.get(e.source)!.push({ node: e.target, edge: e });
    if (!e.directed) adj.get(e.target)!.push({ node: e.source, edge: e });
  }
  for (const list of adj.values()) {
    list.sort((a, b) => (labelOf.get(a.node) ?? a.node).localeCompare(labelOf.get(b.node) ?? b.node));
  }
  return adj;
}

export function hasNegativeWeight(graph: Graph): boolean {
  return graph.edges.some((e) => e.weight < 0 || !Number.isFinite(e.weight));
}

function build(nodes: [string, number, number][], edges: [string, string, number][], directed: boolean): Graph {
  return {
    nodes: nodes.map(([id, x, y]) => ({ id, label: id, x, y })),
    edges: edges.map(([s, t, w]) => ({ id: `${s}${directed ? ">" : "-"}${t}`, source: s, target: t, directed, weight: w })),
  };
}

/** Sample undirected weighted graph (canvas 800×500 coordinate space). */
export function sampleGraph(directed = false): Graph {
  return build(
    [
      ["A", 90, 250],
      ["B", 240, 110],
      ["C", 240, 390],
      ["D", 420, 250],
      ["E", 580, 110],
      ["F", 580, 390],
      ["G", 720, 250],
    ],
    [
      ["A", "B", 4],
      ["A", "C", 2],
      ["B", "C", 1],
      ["B", "D", 5],
      ["C", "D", 8],
      ["C", "F", 10],
      ["D", "E", 2],
      ["D", "F", 6],
      ["E", "G", 3],
      ["F", "G", 1],
    ],
    directed,
  );
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
