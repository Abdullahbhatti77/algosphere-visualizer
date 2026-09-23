/**
 * Cross-cutting audit tests: edge-case matrices, step-integrity replay and
 * reference-model comparisons for every engine.
 */
import { describe, expect, it } from "vitest";

import { StepController, type Scheduler } from "./core/step-controller";
import { formatStat, resolveStats } from "./core/stats";
import { buildTree, emptyTree, inOrder, insert, isValidBST, remove, search } from "./data-structures/bst";
import { seededRandom } from "./data-structures/types";
import { createQueue, dequeue, enqueue, peekQueue, queueValues } from "./data-structures/queue";
import { createStack, peek, pop, push } from "./data-structures/stack";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import {
  addEdge,
  addNode,
  emptyGraph,
  MAX_NODES,
  removeNode,
  sampleGraph,
  setAllDirected,
  setEdgeWeight,
  validateWeight,
} from "./graph/graph-model";
import type { Graph } from "./graph/types";
import { astar } from "./pathfinding/astar";
import { createGrid, generateMaze, setEndpoint, setWall } from "./pathfinding/grid";
import { sortingAlgorithms } from "./registry";

// ---------------------------------------------------------------- sorting

const SORT_CASES: Record<string, number[]> = {
  empty: [],
  single: [5],
  pair: [2, 1],
  allEqual: [3, 3, 3, 3, 3],
  duplicates: [4, 1, 4, 2, 1, 4, 3],
  sorted: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  reversed: [9, 8, 7, 6, 5, 4, 3, 2, 1],
  extremes: [100, 1, 100, 1, 50],
};

function randomArray(seed: number, n: number) {
  const r = seededRandom(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(r() * 100));
}

describe.each(sortingAlgorithms.map((a) => [a.name, a] as const))("audit: %s", (_n, algo) => {
  for (const [label, input] of Object.entries(SORT_CASES)) {
    it(`sorts ${label}`, () => {
      const steps = algo.generate(input);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.at(-1)!.values).toEqual([...input].sort((a, b) => a - b));
      expect(input).toEqual(SORT_CASES[label]); // input never mutated
    });
  }

  it("matches the reference sort on 50 seeded random arrays", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const input = randomArray(seed, 1 + (seed % 40));
      expect(algo.generate(input).at(-1)!.values).toEqual([...input].sort((a, b) => a - b));
    }
  });

  it("every snapshot is explained by exactly the step's own operation", () => {
    for (const input of [SORT_CASES["duplicates"]!, SORT_CASES["reversed"]!, randomArray(7, 25)]) {
      const steps = algo.generate(input);
      expect(steps[0]!.values).toEqual(input);
      for (let i = 1; i < steps.length; i++) {
        const prev = steps[i - 1]!.values;
        const s = steps[i]!;
        const changed = s.values.flatMap((v, k) => (v !== prev[k] ? [k] : []));
        if (s.type === "swap") {
          const [a, b] = s.indices as [number, number];
          const expected = [...prev];
          [expected[a], expected[b]] = [expected[b]!, expected[a]!];
          expect(s.values).toEqual(expected);
        } else if (s.type === "overwrite") {
          expect(changed.every((k) => s.indices.includes(k))).toBe(true);
        } else {
          expect(changed).toEqual([]);
        }
      }
    }
  });

  it("comparison counter increments by at most one, only on steps that compare", () => {
    const steps = algo.generate(randomArray(3, 20));
    for (let i = 1; i < steps.length; i++) {
      const s = steps[i]!;
      const d = s.metrics.comparisons - steps[i - 1]!.metrics.comparisons;
      // Merge sort compares the two run heads (held in auxiliary buffers) and
      // writes the winner in one step; its explanation states the comparison.
      const fused = s.type === "overwrite" && s.explanation.startsWith("Compare run heads");
      expect(d).toBe(s.type === "compare" || fused ? 1 : 0);
    }
  });

  it("swap counter increments exactly on swap steps", () => {
    const steps = algo.generate(randomArray(4, 20));
    for (let i = 1; i < steps.length; i++) {
      const d = steps[i]!.metrics.swaps - steps[i - 1]!.metrics.swaps;
      expect(d).toBe(steps[i]!.type === "swap" ? 1 : 0);
    }
  });

  it("no two consecutive steps are identical", () => {
    const steps = algo.generate(randomArray(5, 15));
    for (let i = 1; i < steps.length; i++) {
      expect(JSON.stringify(steps[i])).not.toBe(JSON.stringify(steps[i - 1]));
    }
  });
});

// ---------------------------------------------------------------- graphs

function graphFrom(labels: string[], edges: [string, string, number][], directed = false): Graph {
  let g = emptyGraph();
  labels.forEach((_, i) => {
    const r = addNode(g, 50 + i * 30, 50);
    if (!r.ok) throw new Error(r.error);
    g = r.value;
  });
  for (const [s, t, w] of edges) {
    const r = addEdge(g, s, t, directed, w);
    if (!r.ok) throw new Error(r.error);
    g = r.value;
  }
  return g;
}

function referenceDistances(g: Graph, source: string): Record<string, number> {
  const d: Record<string, number> = {};
  for (const n of g.nodes) d[n.id] = Infinity;
  d[source] = 0;
  for (let i = 0; i < g.nodes.length; i++) {
    for (const e of g.edges) {
      if (d[e.source]! + e.weight < d[e.target]!) d[e.target] = d[e.source]! + e.weight;
      if (!e.directed && d[e.target]! + e.weight < d[e.source]!) d[e.source] = d[e.target]! + e.weight;
    }
  }
  return d;
}

describe("audit: graph editor", () => {
  it("assigns labels A.. and caps the node count", () => {
    let g = emptyGraph();
    for (let i = 0; i < MAX_NODES; i++) {
      const r = addNode(g, i * 10, 10);
      expect(r.ok).toBe(true);
      if (r.ok) g = r.value;
    }
    expect(g.nodes[0]!.label).toBe("A");
    expect(g.nodes.at(-1)!.label).toBe("Z");
    expect(addNode(g, 1, 1).ok).toBe(false);
  });
  it("rejects self-loops, duplicates (both directions when undirected) and bad weights", () => {
    const g = graphFrom(["A", "B"], [["A", "B", 2]]);
    expect(addEdge(g, "A", "A", false, 1).ok).toBe(false);
    expect(addEdge(g, "B", "A", false, 1).ok).toBe(false);
    expect(addEdge(g, "A", "Z", false, 1).ok).toBe(false);
    for (const w of [-1, Number.NaN, Infinity, 1000]) expect(validateWeight(w)).not.toBeNull();
    expect(validateWeight(0)).toBeNull();
    expect(setEdgeWeight(g, g.edges[0]!.id, -3).ok).toBe(false);
  });
  it("directed graphs allow both directions; converting back collapses to the lighter edge", () => {
    const g = graphFrom(["A", "B"], [["A", "B", 5], ["B", "A", 2]], true);
    expect(g.edges).toHaveLength(2);
    const u = setAllDirected(g, false);
    expect(u.edges).toHaveLength(1);
    expect(u.edges[0]!.weight).toBe(2);
  });
  it("removing a node removes its incident edges", () => {
    const g = removeNode(graphFrom(["A", "B", "C"], [["A", "B", 1], ["B", "C", 1]]), "B");
    expect(g.nodes.map((n) => n.id)).toEqual(["A", "C"]);
    expect(g.edges).toEqual([]);
  });
});

describe("audit: BFS / DFS / Dijkstra", () => {
  const single = graphFrom(["A"], []);
  it("single-node graphs", () => {
    for (const run of [bfs, dfs, dijkstra]) {
      const steps = run(single, { source: "A", target: "A" });
      expect(steps.at(-1)!.order).toEqual(["A"]);
    }
  });
  it("visit sets only grow and every node is visited at most once", () => {
    const g = sampleGraph();
    for (const run of [bfs, dfs, dijkstra]) {
      const steps = run(g, { source: "A" });
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i]!.order.slice(0, steps[i - 1]!.order.length)).toEqual(steps[i - 1]!.order);
        expect(steps[i]!.metrics.visited).toBeGreaterThanOrEqual(steps[i - 1]!.metrics.visited);
      }
      const order = steps.at(-1)!.order;
      expect(new Set(order).size).toBe(order.length);
    }
  });
  it("disconnected components are never reached", () => {
    const g = graphFrom(["A", "B", "C", "D"], [["A", "B", 1], ["C", "D", 1]]);
    for (const run of [bfs, dfs]) expect(run(g, { source: "A" }).at(-1)!.order.sort()).toEqual(["A", "B"]);
    const d = dijkstra(g, { source: "A", target: "D" }).at(-1)!;
    expect(d.path ?? []).toEqual([]);
    expect(d.distances!["D"]).toBe(Infinity);
  });
  it("Dijkstra matches a Bellman-Ford reference on 40 seeded random graphs", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = seededRandom(seed);
      const n = 3 + Math.floor(r() * 8);
      const labels = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
      const directed = seed % 2 === 0;
      const edges: [string, string, number][] = [];
      const seen = new Set<string>();
      for (let k = 0; k < n * 2; k++) {
        const a = labels[Math.floor(r() * n)]!;
        const b = labels[Math.floor(r() * n)]!;
        const key = directed ? `${a}>${b}` : [a, b].sort().join("-");
        if (a === b || seen.has(key)) continue;
        seen.add(key);
        edges.push([a, b, Math.floor(r() * 20)]);
      }
      const g = graphFrom(labels, edges, directed);
      const got = dijkstra(g, { source: "A" }).at(-1)!.distances!;
      expect(got).toEqual(referenceDistances(g, "A"));
    }
  });
});

// ---------------------------------------------------------------- A*

describe("audit: A*", () => {
  it("start adjacent to target and fully walled grids", () => {
    let g = createGrid(5, 5);
    g = setEndpoint(setEndpoint(g, "start", { row: 2, col: 2 }), "target", { row: 2, col: 3 });
    expect(astar(g, "manhattan").path!.length).toBe(2);
    let walled = createGrid(5, 5);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) walled = setWall(walled, { row: r, col: c }, true);
    const res = astar(walled, "euclidean");
    expect(res.path).toBeNull();
    expect(res.steps.at(-1)!.explanation.length).toBeGreaterThan(0);
  });
  it("both heuristics give equal-length paths on 20 mazes", () => {
    for (let seed = 100; seed < 120; seed++) {
      const g = generateMaze(13, 21, seed);
      const a = astar(g, "manhattan").path;
      const b = astar(g, "euclidean").path;
      expect(a?.length).toBe(b?.length);
    }
  });
});

// ---------------------------------------------------------------- data structures

describe("audit: BST against a sorted-set model", () => {
  it("random insert/delete/search sequences", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const r = seededRandom(seed);
      let t = emptyTree();
      const model = new Set<number>();
      for (let k = 0; k < 60; k++) {
        const v = Math.floor(r() * 40);
        const op = r();
        if (op < 0.5 && model.size < 31) {
          const res = insert(t, v);
          expect(res.status).toBe(model.has(v) ? "duplicate" : "ok");
          model.add(v);
          t = res.state;
        } else if (op < 0.8) {
          const res = remove(t, v);
          expect(res.status).toBe(model.has(v) ? "ok" : "not-found");
          model.delete(v);
          t = res.state;
        } else {
          expect(search(t, v).status).toBe(model.has(v) ? "ok" : "not-found");
        }
        expect(isValidBST(t)).toBe(true);
        expect(inOrder(t)).toEqual([...model].sort((a, b) => a - b));
      }
    }
  });
  it("root deletion in all three cases and on a chain", () => {
    expect(remove(buildTree([5]), 5).deleteCase).toBe("leaf");
    expect(remove(buildTree([5, 3]), 5).deleteCase).toBe("one-child");
    expect(remove(buildTree([5, 3, 8]), 5).deleteCase).toBe("two-children");
    const chain = buildTree([1, 2, 3, 4, 5]);
    expect(inOrder(remove(chain, 3).state)).toEqual([1, 2, 4, 5]);
    expect(remove(emptyTree(), 1).status).toBe("not-found");
  });
  it("comparison count equals depth + 1 for a found key", () => {
    const t = buildTree([50, 30, 70, 20]);
    expect(search(t, 20).steps.at(-1)!.work).toBe(3);
  });
});

describe("audit: stack / queue against array models", () => {
  it("stack random sequence", () => {
    const r = seededRandom(9);
    let s = createStack(8);
    const model: number[] = [];
    for (let k = 0; k < 200; k++) {
      const op = r();
      if (op < 0.45) {
        const v = Math.floor(r() * 100);
        const res = push(s, v);
        expect(res.status).toBe(model.length >= 8 ? "overflow" : "ok");
        if (model.length < 8) model.push(v);
        s = res.state;
      } else if (op < 0.85) {
        const res = pop(s);
        expect(res.value).toBe(model.pop());
        expect(res.status).toBe(res.value === undefined ? "underflow" : "ok");
        s = res.state;
      } else {
        expect(peek(s).value).toBe(model.at(-1));
      }
      expect(s.items.map((i) => i.value)).toEqual(model);
    }
  });
  it("queue random sequence (bounded and growing)", () => {
    for (const bounded of [true, false]) {
      const r = seededRandom(bounded ? 11 : 12);
      let q = createQueue(bounded, [], 4);
      const model: number[] = [];
      const limit = bounded ? 4 : 16;
      for (let k = 0; k < 200; k++) {
        const op = r();
        if (op < 0.5) {
          const v = Math.floor(r() * 100);
          const res = enqueue(q, v);
          expect(res.status).toBe(model.length >= limit ? "overflow" : "ok");
          if (model.length < limit) model.push(v);
          q = res.state;
        } else if (op < 0.85) {
          const res = dequeue(q);
          expect(res.value).toBe(model.shift());
          q = res.state;
        } else {
          expect(peekQueue(q).value).toBe(model[0]);
        }
        expect(queueValues(q)).toEqual(model);
      }
    }
  });
});

// ---------------------------------------------------------------- controller + stats

function fakeClock() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const scheduler: Scheduler = {
    now: () => now,
    setTimeout: (fn, ms) => (timers.set(++seq, { at: now + ms, fn }), seq),
    clearTimeout: (h) => void timers.delete(h as number),
  };
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].fn();
    }
    now = end;
  };
  return { scheduler, advance, pending: () => timers.size };
}

describe("audit: StepController races", () => {
  it("nothing advances after reset, load or dispose", () => {
    for (const action of ["reset", "load", "dispose"] as const) {
      const clock = fakeClock();
      const c = new StepController({ totalSteps: 10, intervalMs: 100, scheduler: clock.scheduler });
      c.start();
      clock.advance(150);
      if (action === "load") c.load(10);
      else c[action]();
      const at = c.currentStep;
      clock.advance(5000);
      expect(c.currentStep).toBe(at);
      expect(clock.pending()).toBe(0);
    }
  });
  it("speed change mid-run neither skips nor doubles a step", () => {
    const clock = fakeClock();
    const c = new StepController({ totalSteps: 100, intervalMs: 100, scheduler: clock.scheduler });
    c.start();
    clock.advance(250); // 2 steps
    c.setSpeed(10);
    clock.advance(10);
    expect(c.currentStep).toBe(3);
    c.setSpeed(1000);
    clock.advance(999);
    expect(c.currentStep).toBe(3);
    clock.advance(1);
    expect(c.currentStep).toBe(4);
  });
  it("rapid toggling leaves at most one step timer pending", () => {
    const clock = fakeClock();
    const c = new StepController({ totalSteps: 50, intervalMs: 100, scheduler: clock.scheduler });
    for (let i = 0; i < 21; i++) c.toggle();
    expect(c.isPlaying).toBe(true);
    expect(clock.pending()).toBeLessThanOrEqual(2); // one step + one clock tick
    clock.advance(100);
    expect(c.currentStep).toBe(1);
  });
  it("stops exactly on the final step and reports complete", () => {
    const clock = fakeClock();
    const c = new StepController({ totalSteps: 3, intervalMs: 10, scheduler: clock.scheduler });
    c.start();
    clock.advance(1000);
    expect([c.currentStep, c.state, clock.pending()]).toEqual([2, "complete", 0]);
  });
});

describe("audit: statistics formatting", () => {
  it("renders missing values as a dash, never a fake zero", () => {
    expect(formatStat("comparisons", undefined)).toBe("—");
    expect(formatStat("comparisons", null)).toBe("—");
    expect(formatStat("comparisons", 0)).toBe("0");
    expect(formatStat("elapsed", 1500)).toBe("1.5s");
    expect(formatStat("computeTime", 0.123)).toBe("0.12ms");
  });
  it("resolveStats keeps only and exactly the declared ids, in order", () => {
    const out = resolveStats(["size", "swaps"], { swaps: 3, comparisons: 9 });
    expect(out.map((s) => [s.id, s.value])).toEqual([["size", "—"], ["swaps", "3"]]);
  });
});

// ---------------------------------------------------------------- documentation + documented claims

import { algorithmRegistry } from "./core/catalog";

describe("audit: documentation completeness", () => {
  it("every entry documents overview, how, when, pseudocode, complexity and notes", () => {
    for (const e of algorithmRegistry) {
      expect(e.docs.overview.length, e.id).toBeGreaterThan(20);
      expect(e.docs.howItWorks.length, e.id).toBeGreaterThan(0);
      expect(e.docs.whenUseful.length, e.id).toBeGreaterThan(0);
      expect(e.docs.implementationNotes.length, e.id).toBeGreaterThan(0);
      const code = Array.isArray(e.pseudocode) ? e.pseudocode : Object.values(e.pseudocode).flat();
      expect(code.length, e.id).toBeGreaterThan(0);
    }
  });
  it("sorting entries declare stability and in-place flags", () => {
    for (const e of algorithmRegistry.filter((x) => x.category === "sorting")) {
      expect(typeof e.complexity.stable).toBe("boolean");
      expect(typeof e.complexity.inPlace).toBe("boolean");
    }
  });
});

describe("audit: documented complexity claims hold on this implementation", () => {
  const comps = (id: string, input: number[]) =>
    sortingAlgorithms.find((a) => a.id === id)!.generate(input).at(-1)!.metrics.comparisons;
  it("bubble sort early exit: n − 1 comparisons on sorted input", () => {
    expect(comps("bubble", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(9);
  });
  it("quick sort degrades to n(n−1)/2 comparisons on sorted and all-equal input", () => {
    const n = 20;
    expect(comps("quick", Array.from({ length: n }, (_, i) => i))).toBe((n * (n - 1)) / 2);
    expect(comps("quick", Array.from({ length: n }, () => 7))).toBe((n * (n - 1)) / 2);
  });
  it("merge sort stays within n⌈log2 n⌉ comparisons", () => {
    for (let seed = 1; seed < 10; seed++) {
      const input = randomArray(seed, 32);
      expect(comps("merge", input)).toBeLessThanOrEqual(32 * 5);
    }
  });
});
