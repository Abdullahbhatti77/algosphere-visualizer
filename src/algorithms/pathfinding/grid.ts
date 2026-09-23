/** 2D grid model for pathfinding. React/DOM free. */

export interface Cell {
  row: number;
  col: number;
}

export interface Grid {
  rows: number;
  cols: number;
  /** walls[row * cols + col] */
  walls: boolean[];
  start: Cell;
  target: Cell;
}

export const cellKey = (c: Cell): string => `${c.row},${c.col}`;
export const indexOf = (grid: Grid, c: Cell): number => c.row * grid.cols + c.col;
export const sameCell = (a: Cell, b: Cell): boolean => a.row === b.row && a.col === b.col;

export function createGrid(rows: number, cols: number): Grid {
  return {
    rows,
    cols,
    walls: new Array<boolean>(rows * cols).fill(false),
    start: { row: Math.floor(rows / 2), col: Math.max(1, Math.floor(cols / 5)) },
    target: { row: Math.floor(rows / 2), col: Math.min(cols - 2, cols - 1 - Math.floor(cols / 5)) },
  };
}

export function isWall(grid: Grid, c: Cell): boolean {
  return grid.walls[indexOf(grid, c)] === true;
}

export function setWall(grid: Grid, c: Cell, wall: boolean): Grid {
  if (sameCell(c, grid.start) || sameCell(c, grid.target)) return grid;
  if (isWall(grid, c) === wall) return grid;
  const walls = grid.walls.slice();
  walls[indexOf(grid, c)] = wall;
  return { ...grid, walls };
}

export function setEndpoint(grid: Grid, which: "start" | "target", c: Cell): Grid {
  const other = which === "start" ? grid.target : grid.start;
  if (sameCell(c, other)) return grid;
  const walls = grid.walls.slice();
  walls[indexOf(grid, c)] = false;
  return { ...grid, walls, [which]: c };
}

export function clearWalls(grid: Grid): Grid {
  return { ...grid, walls: new Array<boolean>(grid.rows * grid.cols).fill(false) };
}

/** 4-directional neighbours in fixed order: up, right, down, left. */
export function neighbors(grid: Grid, c: Cell): Cell[] {
  const out: Cell[] = [];
  const deltas: [number, number][] = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];
  for (const [dr, dc] of deltas) {
    const r = c.row + dr;
    const col = c.col + dc;
    if (r < 0 || col < 0 || r >= grid.rows || col >= grid.cols) continue;
    const n = { row: r, col };
    if (!isWall(grid, n)) out.push(n);
  }
  return out;
}

/** Mulberry32 PRNG — deterministic for a given seed. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Recursive-backtracker maze (iterative). Carves passages on odd coordinates,
 * then opens a few extra walls so there are multiple routes. Start and target
 * are snapped onto carved cells so a path always exists.
 */
export function generateMaze(rows: number, cols: number, seed: number): Grid {
  const rand = prng(seed);
  const grid = createGrid(rows, cols);
  const walls = new Array<boolean>(rows * cols).fill(true);
  const open = (r: number, c: number) => (walls[r * cols + c] = false);
  const stack: Cell[] = [{ row: 1, col: 1 }];
  open(1, 1);
  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const options: [number, number][] = [];
    for (const [dr, dc] of [
      [-2, 0],
      [0, 2],
      [2, 0],
      [0, -2],
    ] as [number, number][]) {
      const r = cur.row + dr;
      const c = cur.col + dc;
      if (r > 0 && c > 0 && r < rows - 1 && c < cols - 1 && walls[r * cols + c])
        options.push([dr, dc]);
    }
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [dr, dc] = options[Math.floor(rand() * options.length)]!;
    open(cur.row + dr / 2, cur.col + dc / 2);
    open(cur.row + dr, cur.col + dc);
    stack.push({ row: cur.row + dr, col: cur.col + dc });
  }
  // Knock out ~6% of interior walls for loops.
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (walls[r * cols + c] && rand() < 0.06) walls[r * cols + c] = false;
    }
  }
  const odd = (n: number, max: number) => Math.min(max - 2, n % 2 === 1 ? n : n + 1);
  const start = { row: odd(Math.floor(rows / 2), rows), col: 1 };
  const target = { row: odd(Math.floor(rows / 2), rows), col: odd(cols - 2, cols) };
  walls[start.row * cols + start.col] = false;
  walls[target.row * cols + target.col] = false;
  return { ...grid, walls, start, target };
}
