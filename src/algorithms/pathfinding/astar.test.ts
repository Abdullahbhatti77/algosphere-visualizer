import { describe, expect, it } from "vitest";

import { astar } from "./astar";
import { cellKey, createGrid, generateMaze, neighbors, setWall, type Grid } from "./grid";

function bfsDistance(grid: Grid): number | null {
  const start = cellKey(grid.start);
  const dist = new Map([[start, 0]]);
  const q = [grid.start];
  while (q.length) {
    const c = q.shift()!;
    if (cellKey(c) === cellKey(grid.target)) return dist.get(cellKey(c))!;
    for (const n of neighbors(grid, c)) {
      if (!dist.has(cellKey(n))) {
        dist.set(cellKey(n), dist.get(cellKey(c))! + 1);
        q.push(n);
      }
    }
  }
  return null;
}

function validPath(grid: Grid, path: { row: number; col: number }[]) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    expect(Math.abs(a.row - b.row) + Math.abs(a.col - b.col)).toBe(1);
    expect(grid.walls[b.row * grid.cols + b.col]).toBe(false);
  }
}

describe("A*", () => {
  for (const h of ["manhattan", "euclidean"] as const) {
    it(`finds optimal paths on mazes (${h})`, () => {
      for (const seed of [1, 2, 3, 42, 99]) {
        const grid = generateMaze(15, 25, seed);
        const res = astar(grid, h);
        expect(res.path).not.toBeNull();
        validPath(grid, res.path!);
        expect(res.path!.length - 1).toBe(bfsDistance(grid));
        expect(res.path![0]).toEqual(grid.start);
      }
    });
  }
  it("finds a straight path on an empty grid", () => {
    const grid = createGrid(5, 10);
    const res = astar(grid, "manhattan");
    expect(res.path!.length - 1).toBe(Math.abs(grid.start.col - grid.target.col) + Math.abs(grid.start.row - grid.target.row));
  });
  it("reports no path when the target is enclosed", () => {
    let grid = createGrid(7, 7);
    grid = { ...grid, start: { row: 0, col: 0 }, target: { row: 3, col: 3 } };
    for (const [r, c] of [[2, 3], [4, 3], [3, 2], [3, 4]] as const) grid = setWall(grid, { row: r, col: c }, true);
    const res = astar(grid, "manhattan");
    expect(res.path).toBeNull();
    const end = res.steps[res.steps.length - 1]!;
    expect(end.found).toBe(false);
    expect(end.explanation).toMatch(/No path/);
  });
  it("is deterministic", () => {
    const grid = generateMaze(15, 25, 7);
    expect(astar(grid, "manhattan").steps.length).toBe(astar(grid, "manhattan").steps.length);
  });
});
