import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Brush, Eraser, Flag, MapPin, Shuffle } from "lucide-react";

import { ASTAR_PSEUDOCODE, astar, type CellScore } from "@/algorithms/pathfinding/astar";
import {
  cellKey,
  clearWalls,
  createGrid,
  generateMaze,
  isWall,
  sameCell,
  setEndpoint,
  setWall,
  type Cell,
  type Grid,
} from "@/algorithms/pathfinding/grid";
import { heuristics, type HeuristicId } from "@/algorithms/pathfinding/heuristics";
import { PlaybackBar } from "@/components/viz/playback-bar";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PseudocodePanel } from "@/components/viz/pseudocode-panel";
import { getCatalogEntry } from "@/algorithms/core/catalog";
import { ComplexityCard } from "@/components/viz/complexity-card";
import { AlgorithmDocsCard } from "@/components/viz/algorithm-docs";
import { StatsCard } from "@/components/viz/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePlaybackKeys } from "@/hooks/use-playback-keys";
import { SPEED_LEVELS, speedIndexOf, useStepPlayer, type SpeedId } from "@/hooks/use-step-player";

type Tool = "wall" | "erase" | "start" | "target";
const TOOLS: { id: Tool; label: string; icon: typeof Brush }[] = [
  { id: "wall", label: "Draw wall", icon: Brush },
  { id: "erase", label: "Erase", icon: Eraser },
  { id: "start", label: "Set start", icon: MapPin },
  { id: "target", label: "Set target", icon: Flag },
];
const SIZES = { small: { rows: 13, cols: 21 }, large: { rows: 19, cols: 35 } } as const;
type SizeId = keyof typeof SIZES;
const CELL = 24;

export function AStarVisualizer() {
  const [sizeId, setSizeId] = useState<SizeId>("large");
  const [grid, setGrid] = useState<Grid>(() =>
    generateMaze(SIZES.large.rows, SIZES.large.cols, 20260923),
  );
  const [version, setVersion] = useState(0);
  const [seed, setSeed] = useState(20260923);
  const [tool, setTool] = useState<Tool>("wall");
  const [heuristic, setHeuristic] = useState<HeuristicId>("manhattan");
  const [speed, setSpeed] = useState<SpeedId>("fast");
  const reducedMotionPref = useReducedMotion();
  useEffect(() => {
    if (reducedMotionPref) setSpeed("slow");
  }, [reducedMotionPref]);
  const [cursor, setCursor] = useState<Cell>({ row: 0, col: 0 });
  const [inspect, setInspect] = useState<Cell | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const update = useCallback((next: Grid) => {
    setGrid((prev) => {
      if (prev !== next) setVersion((v) => v + 1);
      return next;
    });
  }, []);

  const { result, generationMs } = useMemo(() => {
    const t0 = performance.now();
    const r = astar(grid, heuristic);
    return { result: r, generationMs: performance.now() - t0 };
  }, [grid, heuristic]);
  const steps = result.steps;

  const player = useStepPlayer(
    steps.length,
    SPEED_LEVELS[speedIndexOf(speed)]!.intervalMs,
    `${version}:${heuristic}`,
  );
  usePlaybackKeys(player);
  const step = steps[player.index]!;
  const editable = player.index === 0 && !player.isPlaying;

  const sets = useMemo(
    () => ({ open: new Set(step.open), closed: new Set(step.closed), path: new Set(step.path) }),
    [step],
  );

  /** Step-accurate score lookup: most recent step that touched the cell. */
  const scoreAt = useCallback(
    (key: string): CellScore | null => {
      for (let i = player.index; i >= 0; i--) {
        const s = steps[i]!;
        if (s.current === key && s.currentScore) return s.currentScore;
        const hit = s.openPreview.find((o) => o.key === key);
        if (hit) return { g: hit.g, h: hit.h, f: hit.f };
      }
      return null;
    },
    [player.index, steps],
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const painting = useRef<Tool | null>(null);

  const cellFromEvent = (event: { clientX: number; clientY: number }): Cell | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    const col = Math.floor(p.x / CELL);
    const row = Math.floor(p.y / CELL);
    if (row < 0 || col < 0 || row >= grid.rows || col >= grid.cols) return null;
    return { row, col };
  };

  const apply = (c: Cell, t: Tool) => {
    setGrid((g) => {
      const next =
        t === "wall"
          ? setWall(g, c, true)
          : t === "erase"
            ? setWall(g, c, false)
            : setEndpoint(g, t, c);
      if (next !== g) setVersion((v) => v + 1);
      return next;
    });
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!editable) return;
    const c = cellFromEvent(e);
    if (!c) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Starting a wall stroke on a wall erases instead (toggle feel).
    const t = tool === "wall" && isWall(grid, c) ? "erase" : tool;
    painting.current = t === "start" || t === "target" ? null : t;
    setCursor(c);
    apply(c, t);
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const c = cellFromEvent(e);
    if (c && e.pointerType === "mouse") setInspect(c);
    if (painting.current && c) apply(c, painting.current);
  };
  const onPointerUp = () => (painting.current = null);

  const onGridKey = (e: ReactKeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const d = moves[e.key];
    if (d) {
      e.preventDefault();
      const next = {
        row: Math.min(grid.rows - 1, Math.max(0, cursor.row + d[0])),
        col: Math.min(grid.cols - 1, Math.max(0, cursor.col + d[1])),
      };
      setCursor(next);
      setInspect(next);
    } else if ((e.key === "Enter" || e.key === " ") && editable) {
      e.preventDefault();
      apply(cursor, tool === "wall" && isWall(grid, cursor) ? "erase" : tool);
    }
  };

  const newMaze = () => {
    const s = (seed * 1103515245 + 12345) % 2147483647;
    setSeed(s);
    const { rows, cols } = SIZES[sizeId];
    update(generateMaze(rows, cols, s));
  };
  const changeSize = (id: SizeId) => {
    setSizeId(id);
    const { rows, cols } = SIZES[id];
    update(createGrid(rows, cols));
  };

  const final = steps[steps.length - 1]!;
  const found = final.found === true;
  const pathLen = result.path ? result.path.length - 1 : null;
  const inspectKey = inspect ? cellKey(inspect) : null;
  const inspectScore = inspectKey ? scoreAt(inspectKey) : null;
  const h = heuristics[heuristic];

  const cellFill = (r: number, c: number): { fill: string; mark?: string } => {
    const k = `${r},${c}`;
    const cell = { row: r, col: c };
    if (grid.walls[r * grid.cols + c]) return { fill: "url(#wall-hatch)" };
    if (sets.path.has(k)) return { fill: "var(--viz-pivot)" };
    if (step.current === k) return { fill: "var(--viz-active)" };
    if (sets.closed.has(k))
      return { fill: "color-mix(in oklch, var(--viz-sorted) 45%, transparent)", mark: "closed" };
    if (sets.open.has(k))
      return { fill: "color-mix(in oklch, var(--viz-compare) 45%, transparent)", mark: "open" };
    void cell;
    return { fill: "var(--card)" };
  };

  const width = grid.cols * CELL;
  const height = grid.rows * CELL;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ToggleGroup
                  type="single"
                  value={tool}
                  onValueChange={(v) => v && setTool(v as Tool)}
                  aria-label="Drawing tool"
                  className="flex-wrap justify-start"
                  disabled={!editable}
                >
                  {TOOLS.map((t) => (
                    <ToggleGroupItem
                      key={t.id}
                      value={t.id}
                      aria-label={t.label}
                      className="h-10 gap-1.5 px-3 text-xs"
                    >
                      <t.icon className="size-4" aria-hidden="true" />
                      {t.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {!editable && (
                  <Button size="sm" variant="secondary" onClick={player.restart}>
                    Reset to edit
                  </Button>
                )}
              </div>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="block h-auto w-full touch-none select-none rounded-md border border-border focus-visible:outline-2 focus-visible:outline-ring"
                role="application"
                aria-label={`A* grid, ${grid.rows} rows by ${grid.cols} columns. Arrow keys move the cursor, Enter applies the ${TOOLS.find((t) => t.id === tool)!.label} tool. Cursor at row ${cursor.row}, column ${cursor.col}.`}
                tabIndex={0}
                data-own-keys
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerLeave={() => setInspect(null)}
                onKeyDown={onGridKey}
              >
                <defs>
                  <pattern
                    id="wall-hatch"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="6" height="6" fill="var(--foreground)" />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="var(--muted-foreground)"
                      strokeWidth="2"
                    />
                  </pattern>
                </defs>
                {Array.from({ length: grid.rows }, (_, r) =>
                  Array.from({ length: grid.cols }, (_, c) => {
                    const { fill, mark } = cellFill(r, c);
                    return (
                      <g key={`${r}-${c}`}>
                        <rect
                          x={c * CELL}
                          y={r * CELL}
                          width={CELL}
                          height={CELL}
                          fill={fill}
                          stroke="var(--border)"
                          strokeWidth={0.5}
                        />
                        {mark === "open" && (
                          <circle
                            cx={c * CELL + CELL / 2}
                            cy={r * CELL + CELL / 2}
                            r={3}
                            fill="var(--foreground)"
                            opacity={0.55}
                          />
                        )}
                        {mark === "closed" && (
                          <rect
                            x={c * CELL + 9}
                            y={r * CELL + 9}
                            width={6}
                            height={6}
                            fill="var(--foreground)"
                            opacity={0.35}
                          />
                        )}
                      </g>
                    );
                  }),
                )}
                {[
                  { c: grid.start, t: "S" },
                  { c: grid.target, t: "T" },
                ].map(({ c, t }) => (
                  <g key={t}>
                    <rect
                      x={c.col * CELL + 2}
                      y={c.row * CELL + 2}
                      width={CELL - 4}
                      height={CELL - 4}
                      rx={4}
                      fill="var(--primary)"
                    />
                    <text
                      x={c.col * CELL + CELL / 2}
                      y={c.row * CELL + CELL / 2 + 5}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight={700}
                      fill="var(--primary-foreground)"
                    >
                      {t}
                    </text>
                  </g>
                ))}
                {step.focus &&
                  (() => {
                    const [r, c] = step.focus.split(",").map(Number) as [number, number];
                    return (
                      <rect
                        x={c * CELL + 1}
                        y={r * CELL + 1}
                        width={CELL - 2}
                        height={CELL - 2}
                        fill="none"
                        stroke="var(--viz-swap)"
                        strokeWidth={2.5}
                        strokeDasharray="4 2"
                      />
                    );
                  })()}
                <rect
                  x={cursor.col * CELL}
                  y={cursor.row * CELL}
                  width={CELL}
                  height={CELL}
                  fill="none"
                  stroke="var(--ring)"
                  strokeWidth={2}
                  className="grid-cursor"
                />
              </svg>
              <ul
                className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
                aria-label="Legend"
              >
                <li className="flex items-center gap-1.5">
                  <span className="inline-flex size-3.5 items-center justify-center border border-border bg-viz-compare/45">
                    <span className="size-1 rounded-full bg-foreground/60" />
                  </span>
                  Open set (dot)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="inline-flex size-3.5 items-center justify-center border border-border bg-viz-sorted/45">
                    <span className="size-1.5 bg-foreground/40" />
                  </span>
                  Closed set (square)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-3.5 border border-border bg-viz-active" />
                  Current
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-3.5 border-2 border-dashed border-viz-swap" />
                  Neighbor being checked
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-3.5 border border-border bg-viz-pivot" />
                  Path
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-3.5 bg-foreground" />
                  Wall (hatched)
                </li>
              </ul>
              <p className="rounded-md bg-muted px-3 py-2 text-sm" aria-live="polite">
                {step.explanation}
              </p>
            </CardContent>
          </Card>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Algorithm state</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="font-mono text-xs">f(n) = g(n) + h(n)</p>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {(["g", "h", "f"] as const).map((k) => (
                    <div key={k} className="rounded-md border border-border bg-surface px-2 py-1.5">
                      <div className="text-muted-foreground">{k}(current)</div>
                      <div>{step.currentScore ? step.currentScore[k] : "—"}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-mono text-foreground">{step.current ?? "—"}</span>{" "}
                  · Open: {step.open.length} · Closed: {step.closed.length}
                </p>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Open set, lowest f first (top 8)
                  </p>
                  <table className="w-full font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="font-normal">cell</th>
                        <th className="font-normal">g</th>
                        <th className="font-normal">h</th>
                        <th className="font-normal">f</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step.openPreview.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-muted-foreground">
                            empty
                          </td>
                        </tr>
                      )}
                      {step.openPreview.map((o) => (
                        <tr key={o.key}>
                          <td>{o.key}</td>
                          <td>{o.g}</td>
                          <td>{o.h}</td>
                          <td>{o.f}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-md border border-border p-2 text-xs">
                  <p className="text-muted-foreground">
                    Inspector (hover, or move the keyboard cursor)
                  </p>
                  {inspect ? (
                    <p className="font-mono">
                      {inspectKey}{" "}
                      {isWall(grid, inspect)
                        ? "wall"
                        : inspectScore
                          ? `g=${inspectScore.g} h=${inspectScore.h} f=${inspectScore.f}`
                          : "not yet discovered"}
                      {sameCell(inspect, grid.start)
                        ? " (start)"
                        : sameCell(inspect, grid.target)
                          ? " (target)"
                          : ""}
                    </p>
                  ) : (
                    <p className="font-mono">—</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pseudocode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PseudocodePanel lines={ASTAR_PSEUDOCODE} activeLine={step.codeLine} />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Implementation: </span>
                  4-directional moves, each costing 1. Open set is a binary min-heap on f with lazy
                  deletion; ties prefer larger g, then row/column order. Cells are expanded at most
                  once.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Result summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{final.explanation}</p>
              {found ? (
                <p className="text-muted-foreground">
                  Path length {pathLen} moves from ({grid.start.row},{grid.start.col}) to (
                  {grid.target.row},{grid.target.col}) using the {h.name} heuristic.{" "}
                  {final.metrics.expanded} cells expanded out of{" "}
                  {grid.walls.filter((w) => !w).length} open cells.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Remove some walls around the start or target, or generate a new maze.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="heuristic">Heuristic</Label>
                <Select
                  value={heuristic}
                  onValueChange={(v) => setHeuristic(v as HeuristicId)}
                  disabled={!editable}
                >
                  <SelectTrigger id="heuristic">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(heuristics).map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="font-mono text-xs">{h.formula}</p>
                <p className="text-xs text-muted-foreground">{h.notes}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grid-size">Grid size</Label>
                <Select
                  value={sizeId}
                  onValueChange={(v) => changeSize(v as SizeId)}
                  disabled={!editable}
                >
                  <SelectTrigger id="grid-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">
                      Small ({SIZES.small.rows}×{SIZES.small.cols}) — best on phones
                    </SelectItem>
                    <SelectItem value="large">
                      Large ({SIZES.large.rows}×{SIZES.large.cols})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={newMaze} disabled={!editable}>
                  <Shuffle className="size-4" /> Random maze
                </Button>
                <Button
                  variant="outline"
                  onClick={() => update(clearWalls(grid))}
                  disabled={!editable}
                >
                  Clear grid
                </Button>
              </div>
              <details className="rounded-md border border-border p-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium text-foreground">
                  How to draw
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Drag across cells to draw walls; starting on a wall erases.</li>
                  <li>Set start / Set target: tap a cell to move S or T.</li>
                  <li>Keyboard: focus the grid, use arrow keys and Enter.</li>
                  <li>Editing is locked mid-run — press Reset to edit.</li>
                </ul>
              </details>
            </CardContent>
          </Card>
          <StatsCard
            ids={getCatalogEntry("astar").stats}
            values={{
              step: `${player.index + 1}/${steps.length}`,
              explored: step.metrics.expanded,
              neighborChecks: step.metrics.neighborChecks,
              pathLength: step.found ? (pathLen ?? null) : null,
              elapsed: player.elapsedMs,
              computeTime: mounted ? generationMs : null,
            }}
          />
          <ComplexityCard meta={getCatalogEntry("astar").complexity} />
        </aside>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6">
        <AlgorithmDocsCard name="A* Search" docs={getCatalogEntry("astar").docs} />
      </div>
      <PlaybackBar
        player={player}
        totalSteps={steps.length}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
