import type { DSOperationResult, DSStep } from "./types";

/**
 * Ordinary (unbalanced) binary search tree. Nodes live in an id-keyed map so
 * each step can carry a cheap immutable snapshot. Duplicates are rejected.
 */
export interface BSTNode {
  id: number;
  value: number;
  left: number | null;
  right: number | null;
}

export interface BSTree {
  root: number | null;
  nodes: Record<number, BSTNode>;
  nextId: number;
}

export type BSTRole = "comparing" | "path" | "found" | "inserted" | "deleted" | "successor" | "replaced";
export type BSTStep = DSStep<BSTree, BSTRole>;
export type DeleteCase = "leaf" | "one-child" | "two-children";
export interface BSTResult extends DSOperationResult<BSTree, BSTRole> {
  deleteCase?: DeleteCase;
}

export const MAX_BST_NODES = 31;

export const BST_PSEUDOCODE = {
  insert: [
    "insert(node, v):",
    "  if node is null: place new node(v) here",
    "  if v == node.value: reject duplicate",
    "  if v < node.value: insert(node.left, v)",
    "  else: insert(node.right, v)",
  ],
  search: [
    "search(node, v):",
    "  if node is null: return NOT FOUND",
    "  if v == node.value: return node",
    "  if v < node.value: return search(node.left, v)",
    "  return search(node.right, v)",
  ],
  delete: [
    "delete(v): locate node z with z.value == v",
    "  if z is null: return NOT FOUND",
    "  if z is a leaf: detach z from its parent",
    "  else if z has one child: link z's parent to that child",
    "  else: s ← leftmost node of z.right   // in-order successor",
    "        copy s.value into z",
    "        detach s (it has no left child) — link its parent to s.right",
  ],
} as const;

export function emptyTree(): BSTree {
  return { root: null, nodes: {}, nextId: 0 };
}

export function size(tree: BSTree): number {
  return Object.keys(tree.nodes).length;
}

export function height(tree: BSTree, id: number | null = tree.root): number {
  if (id === null) return 0;
  const n = tree.nodes[id]!;
  return 1 + Math.max(height(tree, n.left), height(tree, n.right));
}

export function inOrder(tree: BSTree, id: number | null = tree.root, out: number[] = []): number[] {
  if (id === null) return out;
  const n = tree.nodes[id]!;
  inOrder(tree, n.left, out);
  out.push(n.value);
  inOrder(tree, n.right, out);
  return out;
}

export function preOrder(tree: BSTree, id: number | null = tree.root, out: number[] = []): number[] {
  if (id === null) return out;
  const n = tree.nodes[id]!;
  out.push(n.value);
  preOrder(tree, n.left, out);
  preOrder(tree, n.right, out);
  return out;
}

/** True when every node respects the BST ordering invariant. */
export function isValidBST(tree: BSTree, id: number | null = tree.root, lo = -Infinity, hi = Infinity): boolean {
  if (id === null) return true;
  const n = tree.nodes[id]!;
  if (n.value <= lo || n.value >= hi) return false;
  return isValidBST(tree, n.left, lo, n.value) && isValidBST(tree, n.right, n.value, hi);
}

function cloneTree(tree: BSTree): BSTree {
  const nodes: Record<number, BSTNode> = {};
  for (const [k, n] of Object.entries(tree.nodes)) nodes[Number(k)] = { ...n };
  return { root: tree.root, nodes, nextId: tree.nextId };
}

function pathRoles(path: number[], role: BSTRole = "path"): Record<number, BSTRole> {
  const roles: Record<number, BSTRole> = {};
  for (const id of path) roles[id] = role;
  return roles;
}

/** Inserts without recording steps (used to build trees quickly). */
export function insertValue(tree: BSTree, value: number): BSTree {
  return insert(tree, value).state;
}

export function buildTree(values: number[]): BSTree {
  let t = emptyTree();
  for (const v of values) {
    if (size(t) >= MAX_BST_NODES) break;
    t = insertValue(t, v);
  }
  return t;
}

/** Walks from the root toward `value`, recording each comparison. */
function descend(tree: BSTree, value: number, steps: BSTStep[], comparisons: { n: number }, lines: { eq: number; lt: number; gt: number }) {
  const path: number[] = [];
  let parent: number | null = null;
  let current = tree.root;
  let side: "left" | "right" | null = null;
  while (current !== null) {
    const node = tree.nodes[current]!;
    comparisons.n++;
    const roles = { ...pathRoles(path), [current]: "comparing" as BSTRole };
    if (value === node.value) {
      steps.push({ state: tree, roles, codeLine: lines.eq, status: "ok", work: comparisons.n, explanation: `Compare ${value} with ${node.value}: equal.` });
      return { found: current, parent, side, path };
    }
    const goLeft = value < node.value;
    const child = goLeft ? node.left : node.right;
    steps.push({
      state: tree,
      roles,
      codeLine: goLeft ? lines.lt : lines.gt,
      status: "ok",
      work: comparisons.n,
      explanation: `Compare ${value} with ${node.value}: ${value} ${goLeft ? "<" : ">"} ${node.value}, so go ${goLeft ? "left" : "right"}${child === null ? " — that child is empty" : ""}.`,
    });
    path.push(current);
    parent = current;
    side = goLeft ? "left" : "right";
    current = child;
  }
  return { found: null, parent, side, path };
}

export function insert(tree: BSTree, value: number): BSTResult {
  const lines = [...BST_PSEUDOCODE.insert];
  const steps: BSTStep[] = [];
  const cmp = { n: 0 };
  steps.push({ state: tree, roles: {}, codeLine: 0, status: "ok", work: 0, explanation: `insert(${value}): start at the ${tree.root === null ? "empty root" : "root"}.` });
  if (size(tree) >= MAX_BST_NODES) {
    steps.push({ state: tree, roles: {}, codeLine: 0, status: "full", work: 0, explanation: `The tree already has ${MAX_BST_NODES} nodes, the most this view can draw legibly.` });
    return { operation: "insert", pseudocode: lines, steps, state: tree, status: "full" };
  }
  const { found, parent, side, path } = descend(tree, value, steps, cmp, { eq: 2, lt: 3, gt: 4 });
  if (found !== null) {
    steps.push({ state: tree, roles: { ...pathRoles(path), [found]: "found" }, codeLine: 2, status: "duplicate", work: cmp.n, explanation: `${value} is already in the tree. This BST stores unique keys, so the insert is rejected.` });
    return { operation: "insert", pseudocode: lines, steps, state: tree, status: "duplicate" };
  }
  const next = cloneTree(tree);
  const id = next.nextId++;
  next.nodes[id] = { id, value, left: null, right: null };
  if (parent === null) next.root = id;
  else next.nodes[parent]![side!] = id;
  const where = parent === null ? "as the root" : `as the ${side} child of ${tree.nodes[parent]!.value}`;
  steps.push({ state: next, roles: { ...pathRoles(path), [id]: "inserted" }, codeLine: 1, status: "ok", work: cmp.n, explanation: `Reached an empty spot. Place ${value} ${where}. Depth ${path.length}, ${cmp.n} comparison${cmp.n === 1 ? "" : "s"}.` });
  return { operation: "insert", pseudocode: lines, steps, state: next, status: "ok" };
}

export function search(tree: BSTree, value: number): BSTResult {
  const lines = [...BST_PSEUDOCODE.search];
  const steps: BSTStep[] = [];
  const cmp = { n: 0 };
  steps.push({ state: tree, roles: {}, codeLine: 0, status: "ok", work: 0, explanation: `search(${value}): start at the root.` });
  const { found, path } = descend(tree, value, steps, cmp, { eq: 2, lt: 3, gt: 4 });
  if (found === null) {
    steps.push({ state: tree, roles: pathRoles(path), codeLine: 1, status: "not-found", work: cmp.n, explanation: `Reached an empty child: ${value} is not in the tree (${cmp.n} comparison${cmp.n === 1 ? "" : "s"}).` });
    return { operation: "search", pseudocode: lines, steps, state: tree, status: "not-found" };
  }
  steps.push({ state: tree, roles: { ...pathRoles(path), [found]: "found" }, codeLine: 2, status: "ok", work: cmp.n, explanation: `Found ${value} at depth ${path.length} after ${cmp.n} comparison${cmp.n === 1 ? "" : "s"}.` });
  return { operation: "search", pseudocode: lines, steps, state: tree, status: "ok", value };
}

export function remove(tree: BSTree, value: number): BSTResult {
  const lines = [...BST_PSEUDOCODE.delete];
  const steps: BSTStep[] = [];
  const cmp = { n: 0 };
  steps.push({ state: tree, roles: {}, codeLine: 0, status: "ok", work: 0, explanation: `delete(${value}): first locate it, starting at the root.` });
  const { found, parent, side, path } = descend(tree, value, steps, cmp, { eq: 0, lt: 0, gt: 0 });
  if (found === null) {
    steps.push({ state: tree, roles: pathRoles(path), codeLine: 1, status: "not-found", work: cmp.n, explanation: `${value} is not in the tree, so nothing is deleted.` });
    return { operation: "delete", pseudocode: lines, steps, state: tree, status: "not-found" };
  }
  const z = tree.nodes[found]!;
  const base = pathRoles(path);
  const link = (t: BSTree, p: number | null, s: "left" | "right" | null, child: number | null) => {
    if (p === null) t.root = child;
    else t.nodes[p]![s!] = child;
  };

  if (z.left === null && z.right === null) {
    steps.push({ state: tree, roles: { ...base, [found]: "deleted" }, codeLine: 2, status: "ok", work: cmp.n, explanation: `Case 1 — leaf: ${value} has no children, so it can simply be detached${parent === null ? " (it is the only node)" : ` from ${tree.nodes[parent]!.value}`}.` });
    const next = cloneTree(tree);
    link(next, parent, side, null);
    delete next.nodes[found];
    steps.push({ state: next, roles: base, codeLine: 2, status: "ok", work: cmp.n, explanation: `Removed ${value}. ${size(next)} node${size(next) === 1 ? "" : "s"} remain.` });
    return { operation: "delete", pseudocode: lines, steps, state: next, status: "ok", value, deleteCase: "leaf" };
  }

  if (z.left === null || z.right === null) {
    const child = (z.left ?? z.right)!;
    const cv = tree.nodes[child]!.value;
    steps.push({ state: tree, roles: { ...base, [found]: "deleted", [child]: "successor" }, codeLine: 3, status: "ok", work: cmp.n, explanation: `Case 2 — one child: ${value} has only a ${z.left !== null ? "left" : "right"} child (${cv}). ${parent === null ? `${cv} becomes the new root.` : `Link ${tree.nodes[parent]!.value} directly to ${cv}.`}` });
    const next = cloneTree(tree);
    link(next, parent, side, child);
    delete next.nodes[found];
    steps.push({ state: next, roles: { ...base, [child]: "replaced" }, codeLine: 3, status: "ok", work: cmp.n, explanation: `Removed ${value}; its subtree rooted at ${cv} moved up one level. Ordering is preserved.` });
    return { operation: "delete", pseudocode: lines, steps, state: next, status: "ok", value, deleteCase: "one-child" };
  }

  // Two children: in-order successor = leftmost node of the right subtree.
  steps.push({ state: tree, roles: { ...base, [found]: "deleted" }, codeLine: 4, status: "ok", work: cmp.n, explanation: `Case 3 — two children: ${value} has both subtrees. Replace it with its in-order successor, the smallest value in its right subtree.` });
  const walk: number[] = [];
  let sParent = found;
  let s = z.right;
  walk.push(s);
  steps.push({ state: tree, roles: { ...base, [found]: "deleted", [s]: "comparing" }, codeLine: 4, status: "ok", work: cmp.n, explanation: `Step into the right subtree: ${tree.nodes[s]!.value}.` });
  while (tree.nodes[s]!.left !== null) {
    sParent = s;
    s = tree.nodes[s]!.left!;
    walk.push(s);
    steps.push({ state: tree, roles: { ...base, ...pathRoles(walk.slice(0, -1)), [found]: "deleted", [s]: "comparing" }, codeLine: 4, status: "ok", work: cmp.n, explanation: `${tree.nodes[sParent]!.value} has a left child, keep going left: ${tree.nodes[s]!.value}.` });
  }
  const sv = tree.nodes[s]!.value;
  const sRight = tree.nodes[s]!.right;
  steps.push({ state: tree, roles: { ...base, ...pathRoles(walk.slice(0, -1)), [found]: "deleted", [s]: "successor" }, codeLine: 4, status: "ok", work: cmp.n, explanation: `${sv} has no left child, so it is the successor — the next value after ${value} in sorted order.` });
  const copied = cloneTree(tree);
  copied.nodes[found]!.value = sv;
  steps.push({ state: copied, roles: { ...base, [found]: "replaced", [s]: "successor" }, codeLine: 5, status: "ok", work: cmp.n, explanation: `Copy ${sv} into the node that held ${value}. Now ${sv} appears twice; remove the original successor node.` });
  const next = cloneTree(copied);
  if (sParent === found) next.nodes[found]!.right = sRight;
  else next.nodes[sParent]!.left = sRight;
  delete next.nodes[s];
  const tail = sRight === null ? "It was a leaf, so it is detached." : `Its right child ${tree.nodes[sRight]!.value} takes its place.`;
  steps.push({ state: next, roles: { ...base, [found]: "replaced" }, codeLine: 6, status: "ok", work: cmp.n, explanation: `Detach the old ${sv} node. ${tail} ${value} is gone and ordering holds.` });
  return { operation: "delete", pseudocode: lines, steps, state: next, status: "ok", value, deleteCase: "two-children" };
}

/** Inserts several values in order; their traces are concatenated. */
export function insertMany(tree: BSTree, values: number[]): BSTResult {
  let state = tree;
  let offset = 0;
  const steps: BSTStep[] = [];
  let status: BSTResult["status"] = "ok";
  for (const v of values) {
    const r = insert(state, v);
    for (const s of r.steps) steps.push({ ...s, work: s.work + offset });
    offset += r.steps[r.steps.length - 1]!.work;
    state = r.state;
    if (r.status !== "ok") status = r.status;
    if (r.status === "full") break;
  }
  return { operation: values.length === 1 ? "insert" : "insert ×" + values.length, pseudocode: [...BST_PSEUDOCODE.insert], steps, state, status };
}
