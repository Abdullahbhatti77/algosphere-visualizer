import { describe, expect, it } from "vitest";

import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { NegativeWeightError, dijkstra } from "./dijkstra";
import { addEdge, addNode, emptyGraph, sampleGraph, validateWeight } from "./graph-model";
import type { Graph } from "./types";

function g(edges: [string, string, number?][], directed = false, extra: string[] = []): Graph {
  const ids = new Set<string>(extra);
  edges.forEach(([a, b]) => (ids.add(a), ids.add(b)));
  return {
    nodes: [...ids].sort().map((id) => ({ id, label: id, x: 0, y: 0 })),
    edges: edges.map(([s, t, w]) => ({
      id: `${s}${directed ? ">" : "-"}${t}`,
      source: s,
      target: t,
      directed,
      weight: w ?? 1,
    })),
  };
}
const last = <T>(a: T[]) => a[a.length - 1]!;

describe("BFS", () => {
  it("visits level by level", () => {
    const graph = g([
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["C", "E"],
      ["D", "F"],
    ]);
    expect(last(bfs(graph, { source: "A" })).order).toEqual(["A", "B", "C", "D", "E", "F"]);
  });
  it("terminates on cycles and visits each node once", () => {
    const graph = g([
      ["A", "B"],
      ["B", "C"],
      ["C", "A"],
      ["C", "D"],
    ]);
    const order = last(bfs(graph, { source: "A" })).order;
    expect(order).toEqual(["A", "B", "C", "D"]);
  });
  it("leaves disconnected nodes unvisited", () => {
    const graph = g(
      [
        ["A", "B"],
        ["C", "D"],
      ],
      false,
      ["E"],
    );
    const end = last(bfs(graph, { source: "A" }));
    expect(end.order).toEqual(["A", "B"]);
    expect(end.nodeStates["C"]).toBe("unvisited");
    expect(end.nodeStates["E"]).toBe("unvisited");
  });
  it("respects edge direction", () => {
    const graph = g(
      [
        ["A", "B"],
        ["C", "A"],
      ],
      true,
    );
    expect(last(bfs(graph, { source: "A" })).order).toEqual(["A", "B"]);
  });
  it("is deterministic", () => {
    const graph = sampleGraph();
    expect(bfs(graph, { source: "A" }).length).toBe(bfs(graph, { source: "A" }).length);
  });
});

describe("DFS", () => {
  it("matches recursive DFS order", () => {
    const graph = g([
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["C", "E"],
      ["D", "F"],
    ]);
    expect(last(dfs(graph, { source: "A" })).order).toEqual(["A", "B", "D", "F", "C", "E"]);
  });
  it("handles cycles", () => {
    const graph = g([
      ["A", "B"],
      ["B", "C"],
      ["C", "A"],
    ]);
    expect(last(dfs(graph, { source: "A" })).order).toEqual(["A", "B", "C"]);
  });
  it("handles disconnected graphs", () => {
    const graph = g([
      ["A", "B"],
      ["C", "D"],
    ]);
    expect(last(dfs(graph, { source: "C" })).order).toEqual(["C", "D"]);
  });
});

describe("Dijkstra", () => {
  it("finds shortest path on the sample graph", () => {
    const end = last(dijkstra(sampleGraph(), { source: "A", target: "G" }));
    // A-C 2, C-B 1, B-D 5, D-E 2, E-G 3 = 13 ; A-C-B-D-F-G = 2+1+5+6+1 = 15 ; A-C-F-G = 13
    expect(end.distances!["G"]).toBe(13);
    const path = end.path!;
    let cost = 0;
    const graph = sampleGraph();
    for (let i = 1; i < path.length; i++) {
      const e = graph.edges.find(
        (x) =>
          (x.source === path[i - 1] && x.target === path[i]) ||
          (x.target === path[i - 1] && x.source === path[i]),
      )!;
      cost += e.weight;
    }
    expect(cost).toBe(13);
    expect(path[0]).toBe("A");
    expect(last(path)).toBe("G");
  });
  it("computes all distances without a target", () => {
    const end = last(
      dijkstra(
        g([
          ["A", "B", 1],
          ["B", "C", 2],
          ["A", "C", 5],
        ]),
        { source: "A" },
      ),
    );
    expect(end.distances).toEqual({ A: 0, B: 1, C: 3 });
  });
  it("respects directed edges", () => {
    const end = last(
      dijkstra(
        g(
          [
            ["A", "B", 1],
            ["C", "B", 1],
          ],
          true,
        ),
        { source: "A", target: "C" },
      ),
    );
    expect(end.distances!["C"]).toBe(Infinity);
    expect(end.path).toBeUndefined();
    expect(end.explanation).toMatch(/unreachable/);
  });
  it("supports zero weights", () => {
    const end = last(
      dijkstra(
        g([
          ["A", "B", 0],
          ["B", "C", 0],
        ]),
        { source: "A", target: "C" },
      ),
    );
    expect(end.distances!["C"]).toBe(0);
  });
  it("rejects negative weights", () => {
    expect(() => dijkstra(g([["A", "B", -1]]), { source: "A" })).toThrow(NegativeWeightError);
  });
});

describe("graph model validation", () => {
  const base = () => {
    let graph = emptyGraph();
    for (let i = 0; i < 3; i++) {
      const r = addNode(graph, i * 10, 0);
      if (r.ok) graph = r.value;
    }
    return graph;
  };
  it("rejects duplicate edges (both orientations when undirected)", () => {
    const r1 = addEdge(base(), "A", "B", false, 1);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(addEdge(r1.value, "A", "B", false).ok).toBe(false);
    expect(addEdge(r1.value, "B", "A", false).ok).toBe(false);
  });
  it("allows opposite directed edges but not duplicates", () => {
    const r1 = addEdge(base(), "A", "B", true);
    if (!r1.ok) throw new Error();
    expect(addEdge(r1.value, "B", "A", true).ok).toBe(true);
    expect(addEdge(r1.value, "A", "B", true).ok).toBe(false);
  });
  it("rejects self loops and invalid weights", () => {
    expect(addEdge(base(), "A", "A", false).ok).toBe(false);
    expect(addEdge(base(), "A", "B", false, -3).ok).toBe(false);
    expect(validateWeight(Number.NaN)).not.toBeNull();
    expect(validateWeight(Infinity)).not.toBeNull();
    expect(validateWeight(4)).toBeNull();
  });
});
