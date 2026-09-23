import { describe, expect, it } from "vitest";

import { algorithmRegistry, getCatalogEntry } from "../core/catalog";
import { isBigO, validateComplexity } from "../core/complexity";
import {
  buildTree,
  emptyTree,
  height,
  inOrder,
  insert,
  insertMany,
  isValidBST,
  preOrder,
  remove,
  search,
  size,
} from "./bst";
import { layoutTree } from "./bst-layout";
import {
  clearQueue,
  createQueue,
  dequeue,
  enqueue,
  peekQueue,
  queueValues,
  rearSlot,
} from "./queue";
import { clearStack, createStack, peek, pop, push } from "./stack";

const BASE = [50, 30, 70, 20, 40, 60, 80, 35];

describe("BST insert", () => {
  it("places values by the ordering rule", () => {
    const t = buildTree(BASE);
    expect(preOrder(t)).toEqual([50, 30, 20, 40, 35, 70, 60, 80]);
    expect(inOrder(t)).toEqual([...BASE].sort((a, b) => a - b));
    expect(isValidBST(t)).toBe(true);
  });
  it("records one comparison per level and rejects duplicates", () => {
    const t = buildTree(BASE);
    const r = insert(t, 45);
    expect(r.status).toBe("ok");
    expect(r.steps.at(-1)!.work).toBe(3); // 50, 30, 40
    const dup = insert(r.state, 40);
    expect(dup.status).toBe("duplicate");
    expect(size(dup.state)).toBe(size(r.state));
  });
  it("does not mutate the input tree", () => {
    const t = buildTree(BASE);
    const before = JSON.stringify(t);
    insert(t, 1);
    remove(t, 30);
    expect(JSON.stringify(t)).toBe(before);
  });
  it("sorted input degenerates into a chain", () => {
    const t = insertMany(emptyTree(), [1, 2, 3, 4, 5, 6]).state;
    expect(height(t)).toBe(6);
  });
  it("is deterministic", () => {
    expect(insertMany(emptyTree(), BASE).steps.length).toBe(
      insertMany(emptyTree(), BASE).steps.length,
    );
  });
  it("layout never overlaps nodes", () => {
    const t = buildTree(BASE);
    const xs = Object.values(layoutTree(t).positions).map((p) => p.x);
    expect(new Set(xs).size).toBe(xs.length);
  });
});

describe("BST search", () => {
  const t = buildTree(BASE);
  it("finds existing values", () => {
    const r = search(t, 35);
    expect(r.status).toBe("ok");
    expect(r.steps.at(-1)!.work).toBe(4);
    expect(Object.values(r.steps.at(-1)!.roles)).toContain("found");
  });
  it("reports missing values", () => {
    expect(search(t, 65).status).toBe("not-found");
    expect(search(emptyTree(), 1).status).toBe("not-found");
  });
});

describe("BST delete", () => {
  it("leaf", () => {
    const r = remove(buildTree(BASE), 20);
    expect(r.deleteCase).toBe("leaf");
    expect(inOrder(r.state)).toEqual([30, 35, 40, 50, 60, 70, 80]);
    expect(isValidBST(r.state)).toBe(true);
  });
  it("one child", () => {
    const r = remove(buildTree(BASE), 40);
    expect(r.deleteCase).toBe("one-child");
    expect(inOrder(r.state)).toEqual([20, 30, 35, 50, 60, 70, 80]);
    expect(preOrder(r.state)).toEqual([50, 30, 20, 35, 70, 60, 80]);
  });
  it("two children, successor deep in right subtree", () => {
    const r = remove(buildTree(BASE), 30);
    expect(r.deleteCase).toBe("two-children");
    expect(inOrder(r.state)).toEqual([20, 35, 40, 50, 60, 70, 80]);
    expect(preOrder(r.state)).toEqual([50, 35, 20, 40, 70, 60, 80]);
    expect(r.steps.some((s) => Object.values(s.roles).includes("successor"))).toBe(true);
  });
  it("two children, successor is the direct right child", () => {
    const r = remove(buildTree([50, 30, 70, 80]), 50);
    expect(preOrder(r.state)).toEqual([70, 30, 80]);
    expect(isValidBST(r.state)).toBe(true);
  });
  it("root with one child, last node, missing value", () => {
    expect(preOrder(remove(buildTree([5, 9]), 5).state)).toEqual([9]);
    expect(remove(buildTree([5]), 5).state.root).toBeNull();
    expect(remove(buildTree(BASE), 999).status).toBe("not-found");
  });
  it("deleting every value in any order keeps a valid BST", () => {
    let t = buildTree(BASE);
    for (const v of [50, 20, 70, 35, 30, 80, 40, 60]) {
      t = remove(t, v).state;
      expect(isValidBST(t)).toBe(true);
    }
    expect(size(t)).toBe(0);
  });
});

describe("Stack", () => {
  it("push/pop/peek follow LIFO", () => {
    let s = createStack();
    for (const v of [1, 2, 3]) s = push(s, v).state;
    const p = peek(s);
    expect(p.value).toBe(3);
    expect(p.state.items.length).toBe(3);
    const a = pop(p.state);
    expect(a.value).toBe(3);
    expect(pop(a.state).value).toBe(2);
    expect(a.state.operations).toBe(5);
  });
  it("underflow on empty", () => {
    expect(pop(createStack()).status).toBe("underflow");
    expect(peek(createStack()).status).toBe("underflow");
  });
  it("overflow when bounded", () => {
    let s = createStack(2);
    s = push(push(s, 1).state, 2).state;
    const r = push(s, 3);
    expect(r.status).toBe("overflow");
    expect(r.state.items.map((i) => i.value)).toEqual([1, 2]);
  });
  it("clear empties", () => {
    expect(clearStack(createStack(null, [1, 2])).state.items).toEqual([]);
  });
});

describe("Queue", () => {
  it("enqueue/dequeue/peek follow FIFO", () => {
    let q = createQueue();
    for (const v of [1, 2, 3]) q = enqueue(q, v).state;
    expect(peekQueue(q).value).toBe(1);
    const d = dequeue(q);
    expect(d.value).toBe(1);
    expect(queueValues(d.state)).toEqual([2, 3]);
  });
  it("underflow on empty", () => {
    expect(dequeue(createQueue()).status).toBe("underflow");
    expect(peekQueue(createQueue()).status).toBe("underflow");
  });
  it("wraps around the circular buffer", () => {
    let q = createQueue(true, [1, 2, 3, 4], 4);
    q = dequeue(dequeue(q).state).state; // head = 2
    q = enqueue(q, 5).state;
    expect(rearSlot(q)).toBe(0);
    q = enqueue(q, 6).state;
    expect(queueValues(q)).toEqual([3, 4, 5, 6]);
    expect(enqueue(q, 7).status).toBe("overflow");
  });
  it("grows when unbounded and preserves order", () => {
    let q = createQueue(false, [1, 2, 3, 4], 4);
    q = dequeue(q).state;
    q = enqueue(q, 5).state;
    q = enqueue(q, 6).state;
    expect(q.buffer.length).toBe(8);
    expect(queueValues(q)).toEqual([2, 3, 4, 5, 6]);
    expect(clearQueue(q).state.size).toBe(0);
  });
});

describe("Complexity metadata", () => {
  it("every catalogue entry is complete and valid", () => {
    expect(algorithmRegistry.length).toBeGreaterThanOrEqual(11);
    const ids = new Set<string>();
    for (const e of algorithmRegistry) {
      expect(validateComplexity(e.complexity)).toEqual([]);
      expect(e.stats.length).toBeGreaterThan(0);
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
    }
  });
  it("BST matches the documented bounds", () => {
    const c = getCatalogEntry("bst").complexity;
    expect([c.averageTime, c.worstTime, c.space]).toEqual(["O(log n)", "O(n)", "O(n)"]);
    for (const op of c.operations!) expect([op.average, op.worst]).toEqual(["O(log n)", "O(n)"]);
  });
  it("stack and queue operation bounds match the implemented storage models", () => {
    for (const op of getCatalogEntry("stack").complexity.operations!) expect(op.worst).toBe("O(1)");
    const queueOps = getCatalogEntry("queue").complexity.operations!;
    expect(queueOps.find((op) => op.operation === "Enqueue")?.worst).toBe(
      "O(1) bounded, O(n) resize",
    );
    for (const op of queueOps.filter((op) => op.operation !== "Enqueue"))
      expect(op.worst).toBe("O(1)");
  });
  it("isBigO rejects malformed strings", () => {
    expect(isBigO("O(n log n)")).toBe(true);
    expect(isBigO("fast")).toBe(false);
    expect(isBigO("O(n")).toBe(false);
  });
});
