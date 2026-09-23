import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/algorithms/graph/graph-model";
import type {
  EdgeVisualState,
  Graph,
  GraphEdge,
  GraphStep,
  NodeVisualState,
} from "@/algorithms/graph/types";

export type EditorMode = "select" | "add-node" | "add-edge" | "delete";

interface GraphCanvasProps {
  graph: Graph;
  step: GraphStep | null;
  showWeights: boolean;
  mode: EditorMode;
  editable: boolean;
  source: string | null;
  target: string | null;
  selectedNode: string | null;
  selectedEdge: string | null;
  pendingEdgeFrom: string | null;
  onCanvasClick: (x: number, y: number) => void;
  onNodeClick: (id: string) => void;
  onEdgeClick: (id: string) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
}

const R = 22;

const NODE_STYLE: Record<
  NodeVisualState,
  { fill: string; stroke: string; dash?: string; width: number; text: string }
> = {
  unvisited: {
    fill: "var(--card)",
    stroke: "var(--muted-foreground)",
    width: 1.5,
    text: "var(--foreground)",
  },
  discovered: {
    fill: "var(--card)",
    stroke: "var(--viz-compare)",
    dash: "5 4",
    width: 3,
    text: "var(--foreground)",
  },
  queued: {
    fill: "var(--card)",
    stroke: "var(--viz-compare)",
    dash: "5 4",
    width: 3,
    text: "var(--foreground)",
  },
  current: {
    fill: "var(--viz-active)",
    stroke: "var(--viz-active)",
    width: 3,
    text: "var(--primary-foreground)",
  },
  visited: {
    fill: "var(--viz-sorted)",
    stroke: "var(--viz-sorted)",
    width: 2,
    text: "var(--primary-foreground)",
  },
  path: {
    fill: "var(--viz-pivot)",
    stroke: "var(--viz-pivot)",
    width: 3,
    text: "var(--primary-foreground)",
  },
};

const EDGE_STYLE: Record<EdgeVisualState, { stroke: string; width: number; dash?: string }> = {
  idle: { stroke: "var(--muted-foreground)", width: 1.5 },
  considered: { stroke: "var(--muted-foreground)", width: 1.5, dash: "4 4" },
  tree: { stroke: "var(--viz-active)", width: 3 },
  relaxed: { stroke: "var(--viz-compare)", width: 3 },
  path: { stroke: "var(--viz-pivot)", width: 5 },
};

function edgeGeometry(graph: Graph, edge: GraphEdge, R: number) {
  const a = graph.nodes.find((n) => n.id === edge.source)!;
  const b = graph.nodes.find((n) => n.id === edge.target)!;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Offset directed edges that have an opposite twin so both stay visible.
  const twin =
    edge.directed && graph.edges.some((e) => e.source === edge.target && e.target === edge.source);
  const off = twin ? 8 : 0;
  const ox = -uy * off;
  const oy = ux * off;
  const x1 = a.x + ux * R + ox;
  const y1 = a.y + uy * R + oy;
  const x2 = b.x - ux * (R + (edge.directed ? 4 : 0)) + ox;
  const y2 = b.y - uy * (R + (edge.directed ? 4 : 0)) + oy;
  return {
    x1,
    y1,
    x2,
    y2,
    ux,
    uy,
    mx: (x1 + x2) / 2 - uy * (twin ? 10 : 0),
    my: (y1 + y2) / 2 + ux * (twin ? 10 : 0),
  };
}

export function GraphCanvas(props: GraphCanvasProps) {
  const { graph, step, mode, editable } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; moved: boolean } | null>(null);
  // On narrow screens the 800-unit canvas is drawn at a fraction of its size;
  // enlarge nodes and labels (not positions) so they stay readable and tappable.
  const [k, setK] = useState(1);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? CANVAS_WIDTH;
      setK(Math.min(2, Math.max(1, 560 / Math.max(w, 1))));
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const toLocal = (event: { clientX: number; clientY: number }) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    const p = ctm ? pt.matrixTransform(ctm.inverse()) : pt;
    return {
      x: Math.min(CANVAS_WIDTH - R, Math.max(R, p.x)),
      y: Math.min(CANVAS_HEIGHT - R, Math.max(R, p.y)),
    };
  };

  const onBackgroundPointerUp = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!editable) return;
    const { x, y } = toLocal(event);
    props.onCanvasClick(x, y);
  };

  const onNodePointerDown = (event: ReactPointerEvent<SVGGElement>, id: string) => {
    event.stopPropagation();
    if (editable && mode === "select") {
      (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
      drag.current = { id, moved: false };
    }
  };
  const onNodePointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    if (!drag.current) return;
    drag.current.moved = true;
    const { x, y } = toLocal(event);
    props.onNodeMove(drag.current.id, x, y);
  };
  const onNodePointerUp = (event: ReactPointerEvent<SVGGElement>, id: string) => {
    event.stopPropagation();
    const d = drag.current;
    drag.current = null;
    if (d?.moved) return;
    props.onNodeClick(id);
  };

  const nodeState = (id: string): NodeVisualState => step?.nodeStates[id] ?? "unvisited";
  const edgeState = (id: string): EdgeVisualState => step?.edgeStates[id] ?? "idle";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      className="block h-auto w-full touch-none select-none rounded-md border border-border bg-surface"
      role="img"
      aria-label={`Graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges. A text summary is available below.`}
    >
      <defs>
        <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        fill="url(#graph-grid)"
        onPointerUp={onBackgroundPointerUp}
        className={editable && mode === "add-node" ? "cursor-crosshair" : undefined}
      />

      {graph.edges.map((edge) => {
        const s = EDGE_STYLE[edgeState(edge.id)];
        const g = edgeGeometry(graph, edge, R * k);
        const selected = props.selectedEdge === edge.id;
        const head = 12;
        const arrow = `${g.x2},${g.y2} ${g.x2 - g.ux * head - g.uy * 6},${g.y2 - g.uy * head + g.ux * 6} ${g.x2 - g.ux * head + g.uy * 6},${g.y2 - g.uy * head - g.ux * 6}`;
        return (
          <g
            key={edge.id}
            onPointerUp={(e) => {
              e.stopPropagation();
              props.onEdgeClick(edge.id);
            }}
            className={editable ? "cursor-pointer" : undefined}
          >
            <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="transparent" strokeWidth={18} />
            {selected && (
              <line
                x1={g.x1}
                y1={g.y1}
                x2={g.x2}
                y2={g.y2}
                stroke="var(--ring)"
                strokeWidth={s.width + 6}
                strokeOpacity={0.4}
              />
            )}
            <line
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke={s.stroke}
              strokeWidth={s.width}
              strokeDasharray={s.dash}
            />
            {edge.directed && <polygon points={arrow} fill={s.stroke} />}
            {props.showWeights && (
              <g transform={`translate(${g.mx} ${g.my}) scale(${k})`}>
                <rect
                  x={-14}
                  y={-10}
                  width={28}
                  height={20}
                  rx={4}
                  fill="var(--background)"
                  stroke="var(--border)"
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fontSize="12"
                  className="font-mono"
                  fill="var(--foreground)"
                >
                  {edge.weight}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {graph.nodes.map((node) => {
        const state = nodeState(node.id);
        const s = NODE_STYLE[state];
        const selected = props.selectedNode === node.id || props.pendingEdgeFrom === node.id;
        const dist = step?.distances?.[node.id];
        return (
          <g
            key={node.id}
            transform={`translate(${node.x} ${node.y}) scale(${k})`}
            onPointerDown={(e) => onNodePointerDown(e, node.id)}
            onPointerMove={onNodePointerMove}
            onPointerUp={(e) => onNodePointerUp(e, node.id)}
            className={
              editable ? (mode === "select" ? "cursor-grab" : "cursor-pointer") : undefined
            }
          >
            <circle r={R + 12} fill="transparent" />
            {selected && (
              <circle
                r={R + 7}
                fill="none"
                stroke="var(--ring)"
                strokeWidth={3}
                strokeDasharray="3 3"
              />
            )}
            {state === "current" && (
              <circle r={R + 5} fill="none" stroke="var(--viz-active)" strokeWidth={2} />
            )}
            <circle
              r={R}
              fill={s.fill}
              stroke={s.stroke}
              strokeWidth={s.width}
              strokeDasharray={s.dash}
            />
            <text
              y={5}
              textAnchor="middle"
              fontSize="15"
              fontWeight={600}
              fill={s.text}
              className="font-mono"
            >
              {node.label}
            </text>
            {state === "visited" && (
              <text x={R - 4} y={-R + 6} fontSize="12" fill="var(--viz-sorted)" fontWeight={700}>
                ✓
              </text>
            )}
            {(props.source === node.id || props.target === node.id) && (
              <g transform={`translate(${-R + 2} ${-R + 2})`}>
                <rect x={-9} y={-9} width={18} height={18} rx={4} fill="var(--foreground)" />
                <text
                  y={4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={700}
                  fill="var(--background)"
                >
                  {props.source === node.id ? "S" : "T"}
                </text>
              </g>
            )}
            {dist !== undefined && (
              <text
                y={R + 16}
                textAnchor="middle"
                fontSize="12"
                className="font-mono"
                fill="var(--muted-foreground)"
              >
                d={dist === Infinity ? "∞" : dist}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function GraphLegend() {
  const items: { label: string; swatch: React.ReactNode }[] = [
    {
      label: "Unvisited",
      swatch: (
        <circle r={7} fill="var(--card)" stroke="var(--muted-foreground)" strokeWidth={1.5} />
      ),
    },
    {
      label: "Discovered / in frontier (dashed)",
      swatch: (
        <circle
          r={7}
          fill="var(--card)"
          stroke="var(--viz-compare)"
          strokeWidth={2.5}
          strokeDasharray="3 2"
        />
      ),
    },
    {
      label: "Current (double ring)",
      swatch: (
        <>
          <circle r={8} fill="none" stroke="var(--viz-active)" />
          <circle r={6} fill="var(--viz-active)" />
        </>
      ),
    },
    { label: "Visited / finalized (✓)", swatch: <circle r={7} fill="var(--viz-sorted)" /> },
    { label: "Final path (thick)", swatch: <circle r={7} fill="var(--viz-pivot)" /> },
    {
      label: "S = source, T = target",
      swatch: <rect x={-7} y={-7} width={14} height={14} rx={3} fill="var(--foreground)" />,
    },
  ];
  return (
    <ul
      className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
      aria-label="Legend"
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <svg width={18} height={18} viewBox="-9 -9 18 18" aria-hidden="true">
            {item.swatch}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
