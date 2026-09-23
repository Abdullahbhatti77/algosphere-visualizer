import type { BSTree } from "./bst";

export interface BSTLayout {
  positions: Record<number, { x: number; y: number; depth: number }>;
  width: number;
  height: number;
  spacing: number;
}

export const BST_NODE_R = 18;
const SPACING = 46;
const LEVEL = 64;
const PAD = 32;

/**
 * x = in-order rank, y = depth. In-order ranks are unique, so nodes can never
 * overlap no matter how skewed the tree is.
 */
export function layoutTree(tree: BSTree): BSTLayout {
  const positions: BSTLayout["positions"] = {};
  let rank = 0;
  let maxDepth = 0;
  const visit = (id: number | null, depth: number) => {
    if (id === null) return;
    const n = tree.nodes[id]!;
    visit(n.left, depth + 1);
    positions[id] = { x: PAD + rank * SPACING, y: PAD + depth * LEVEL, depth };
    rank++;
    maxDepth = Math.max(maxDepth, depth);
    visit(n.right, depth + 1);
  };
  visit(tree.root, 0);
  return {
    positions,
    width: Math.max(PAD * 2 + Math.max(0, rank - 1) * SPACING, 240),
    height: PAD * 2 + maxDepth * LEVEL,
    spacing: SPACING,
  };
}
