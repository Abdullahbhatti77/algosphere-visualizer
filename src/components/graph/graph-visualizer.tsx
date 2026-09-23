import { useCallback, useEffect, useMemo, useState } from "react";
import { Eraser, GitBranch, MousePointer2, Plus, Shapes, Trash2 } from "lucide-react";

import {
  addEdge,
  addNode,
  emptyGraph,
  moveNode,
  removeEdge,
  removeNode,
  sampleGraph,
  setAllDirected,
  setEdgeWeight,
} from "@/algorithms/graph/graph-model";
import { formatDistance } from "@/algorithms/graph/recorder";
import { getGraphAlgorithm, graphAlgorithms } from "@/algorithms/graph/registry";
import type { Graph, GraphStep } from "@/algorithms/graph/types";
import { GraphCanvas, GraphLegend, type EditorMode } from "@/components/graph/graph-canvas";
import { PlaybackBar } from "@/components/viz/playback-bar";
import { PseudocodePanel } from "@/components/viz/pseudocode-panel";
import { getCatalogEntry } from "@/algorithms/core/catalog";
import { ComplexityCard } from "@/components/viz/complexity-card";
import { StatsCard } from "@/components/viz/stats-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePlaybackKeys } from "@/hooks/use-playback-keys";
import { SPEED_LEVELS, speedIndexOf, useStepPlayer, type SpeedId } from "@/hooks/use-step-player";

const NONE = "__none__";

const MODES: { id: EditorMode; label: string; icon: typeof Plus }[] = [
  { id: "select", label: "Move", icon: MousePointer2 },
  { id: "add-node", label: "Add node", icon: Plus },
  { id: "add-edge", label: "Add edge", icon: GitBranch },
  { id: "delete", label: "Delete", icon: Eraser },
];

export function GraphVisualizer() {
  const [graph, setGraph] = useState<Graph>(() => sampleGraph());
  const [version, setVersion] = useState(0);
  const [directed, setDirected] = useState(false);
  const [algorithmId, setAlgorithmId] = useState("bfs");
  const [source, setSource] = useState<string | null>("A");
  const [target, setTarget] = useState<string | null>("G");
  const [mode, setMode] = useState<EditorMode>("select");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState("1");
  const [weightDraft, setWeightDraft] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [speed, setSpeed] = useState<SpeedId>("slow");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const algorithm = getGraphAlgorithm(algorithmId);

  const update = useCallback((next: Graph) => {
    setGraph(next);
    setVersion((v) => v + 1);
  }, []);

  // Keep source/target pointing at existing nodes.
  useEffect(() => {
    const ids = graph.nodes.map((n) => n.id);
    if (source && !ids.includes(source)) setSource(ids[0] ?? null);
    if (!source && ids[0]) setSource(ids[0]);
    if (target && !ids.includes(target)) setTarget(null);
  }, [graph, source, target]);

  const { steps, generationMs, runError } = useMemo(() => {
    const t0 = performance.now();
    if (!source || !graph.nodes.some((n) => n.id === source)) {
      return { steps: [] as GraphStep[], generationMs: 0, runError: "Add a node and choose a source to run." };
    }
    try {
      const s = algorithm.generate(graph, { source, target: algorithm.usesTarget ? target : null });
      return { steps: s, generationMs: performance.now() - t0, runError: null };
    } catch (err) {
      return { steps: [] as GraphStep[], generationMs: 0, runError: (err as Error).message };
    }
  }, [algorithm, graph, source, target]);

  const intervalMs = SPEED_LEVELS[speedIndexOf(speed)]!.intervalMs;
  const player = useStepPlayer(steps.length, intervalMs, `${algorithmId}:${version}:${source}:${target}`);
  const step = steps[player.index] ?? null;
  const editable = player.index === 0 && !player.isPlaying;
  const displayStep = step;

  const deleteSelection = useCallback(() => {
    if (!editable) return;
    if (selectedNode) {
      update(removeNode(graph, selectedNode));
      setMessage({ kind: "info", text: `Deleted node ${selectedNode} and its edges.` });
      setSelectedNode(null);
    } else if (selectedEdge) {
      update(removeEdge(graph, selectedEdge));
      setMessage({ kind: "info", text: "Deleted edge." });
      setSelectedEdge(null);
    }
  }, [editable, graph, selectedEdge, selectedNode, update]);

  const extraKeys = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") deleteSelection();
      if (event.key === "Escape") {
        setPendingFrom(null);
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    },
    [deleteSelection],
  );
  usePlaybackKeys(player, extraKeys);

  const onCanvasClick = (x: number, y: number) => {
    setSelectedEdge(null);
    setSelectedNode(null);
    if (mode !== "add-node") {
      setPendingFrom(null);
      return;
    }
    const r = addNode(graph, Math.round(x), Math.round(y));
    if (r.ok) {
      update(r.value);
      setMessage(null);
    } else setMessage({ kind: "error", text: r.error });
  };

  const onNodeClick = (id: string) => {
    if (!editable) return;
    setSelectedEdge(null);
    if (mode === "delete") {
      update(removeNode(graph, id));
      setMessage({ kind: "info", text: `Deleted node ${id} and its edges.` });
      return;
    }
    if (mode === "add-edge") {
      if (!pendingFrom) {
        setPendingFrom(id);
        setMessage({ kind: "info", text: `Edge from ${id}: now select the second node.` });
        return;
      }
      const w = Number(newWeight);
      const r = addEdge(graph, pendingFrom, id, directed, w);
      if (r.ok) {
        update(r.value);
        setMessage({ kind: "info", text: `Added edge ${pendingFrom} ${directed ? "→" : "—"} ${id} (weight ${w}).` });
      } else setMessage({ kind: "error", text: r.error });
      setPendingFrom(null);
      return;
    }
    setSelectedNode(id === selectedNode ? null : id);
  };

  const onEdgeClick = (id: string) => {
    if (!editable) return;
    if (mode === "delete") {
      update(removeEdge(graph, id));
      setMessage({ kind: "info", text: "Deleted edge." });
      return;
    }
    setSelectedNode(null);
    setSelectedEdge(id);
    setWeightDraft(String(graph.edges.find((e) => e.id === id)?.weight ?? ""));
  };

  const applyWeight = () => {
    if (!selectedEdge) return;
    const r = setEdgeWeight(graph, selectedEdge, weightDraft.trim() === "" ? Number.NaN : Number(weightDraft));
    if (r.ok) {
      update(r.value);
      setMessage(null);
    } else setMessage({ kind: "error", text: r.error });
  };

  const toggleDirected = (value: boolean) => {
    setDirected(value);
    update(setAllDirected(graph, value));
    setSelectedEdge(null);
  };

  const selectedEdgeObj = graph.edges.find((e) => e.id === selectedEdge);
  const final = steps[steps.length - 1];
  const labels = graph.nodes.map((n) => n.id);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={(v) => {
                    if (!v) return;
                    setMode(v as EditorMode);
                    setPendingFrom(null);
                  }}
                  aria-label="Editor mode"
                  className="flex-wrap justify-start"
                  disabled={!editable}
                >
                  {MODES.map((m) => (
                    <ToggleGroupItem key={m.id} value={m.id} aria-label={m.label} className="h-10 gap-1.5 px-3 text-xs">
                      <m.icon className="size-4" aria-hidden="true" />
                      {m.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {!editable && (
                  <Button size="sm" variant="secondary" onClick={player.restart}>
                    Reset to edit
                  </Button>
                )}
              </div>
              <GraphCanvas
                graph={graph}
                step={displayStep}
                showWeights={algorithm.usesWeights || selectedEdge !== null}
                mode={mode}
                editable={editable}
                source={source}
                target={algorithm.usesTarget ? target : null}
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                pendingEdgeFrom={pendingFrom}
                onCanvasClick={onCanvasClick}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onNodeMove={(id, x, y) => setGraph((g) => moveNode(g, id, Math.round(x), Math.round(y)))}
              />
              <GraphLegend />
              {message && (
                <p
                  role={message.kind === "error" ? "alert" : "status"}
                  className={message.kind === "error" ? "rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive" : "text-xs text-muted-foreground"}
                >
                  {message.text}
                </p>
              )}
              <p className="rounded-md bg-muted px-3 py-2 text-sm" aria-live="polite">
                {runError ?? step?.explanation ?? "Ready."}
              </p>
            </CardContent>
          </Card>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Algorithm state</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{algorithm.frontierLabel}</p>
                  <ol className="flex min-h-9 flex-wrap gap-1.5 rounded-md border border-border bg-surface p-1.5 font-mono text-xs" aria-label={algorithm.frontierLabel}>
                    {(step?.frontier ?? []).length === 0 && <li className="px-1 py-1 text-muted-foreground">empty</li>}
                    {(step?.frontier ?? []).map((f, i) => (
                      <li key={`${f.id}-${i}`} className="rounded border border-border bg-background px-2 py-1">
                        {f.id}
                        {f.priority !== undefined && <span className="text-muted-foreground">:{f.priority}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {algorithm.id === "dijkstra" ? "Finalized (visited set)" : "Traversal order"}
                  </p>
                  <p className="font-mono text-xs">{step?.order.length ? step.order.join(" → ") : "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Current node</p>
                  <p className="font-mono text-xs">{step?.current ?? "—"}</p>
                </div>
                {algorithm.id === "dijkstra" && step?.distances && (
                  <table className="w-full font-mono text-xs">
                    <caption className="sr-only">Tentative distances and predecessors</caption>
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-1 font-normal">Node</th>
                        <th className="py-1 font-normal">dist</th>
                        <th className="py-1 font-normal">prev</th>
                        <th className="py-1 font-normal">state</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labels.map((id) => (
                        <tr key={id} className={step.current === id ? "bg-accent" : undefined}>
                          <td className="py-0.5">{id}</td>
                          <td>{formatDistance(step.distances![id])}</td>
                          <td>{step.predecessors?.[id] ?? "—"}</td>
                          <td className="text-muted-foreground">{step.order.includes(id) ? "final" : step.nodeStates[id] === "queued" ? "in heap" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pseudocode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PseudocodePanel lines={algorithm.pseudocode} activeLine={step?.codeLine} />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Implementation: </span>
                  {algorithm.implementation}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Result summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{algorithm.overview}</p>
              <p className="font-medium">{runError ?? final?.explanation}</p>
              {final && algorithm.id !== "dijkstra" && (
                <p className="text-muted-foreground">
                  Visited {final.order.length} of {graph.nodes.length} nodes after examining {final.metrics.edgeChecks} edge endpoints.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Algorithm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="graph-algorithm">Algorithm</Label>
                <Select value={algorithmId} onValueChange={setAlgorithmId}>
                  <SelectTrigger id="graph-algorithm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {graphAlgorithms.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{algorithm.tagline}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="graph-source">Source</Label>
                  <Select value={source ?? NONE} onValueChange={(v) => setSource(v === NONE ? null : v)} disabled={!editable}>
                    <SelectTrigger id="graph-source"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {labels.length === 0 && <SelectItem value={NONE}>No nodes</SelectItem>}
                      {labels.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="graph-target">Target</Label>
                  <Select value={target ?? NONE} onValueChange={(v) => setTarget(v === NONE ? null : v)} disabled={!editable || !algorithm.usesTarget}>
                    <SelectTrigger id="graph-target"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None (all)</SelectItem>
                      {labels.filter((id) => id !== source).map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!algorithm.usesTarget && <p className="text-xs text-muted-foreground">Traversals visit everything reachable; no target needed.</p>}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Graph editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="graph-directed">Directed edges</Label>
                <Switch id="graph-directed" checked={directed} onCheckedChange={toggleDirected} disabled={!editable} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-weight">Weight for new edges</Label>
                <Input id="new-weight" type="number" min={0} inputMode="numeric" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} disabled={!editable} />
              </div>
              {selectedEdgeObj && (
                <div className="space-y-1.5 rounded-md border border-border p-2">
                  <Label htmlFor="edge-weight">
                    Weight of {selectedEdgeObj.source} {selectedEdgeObj.directed ? "→" : "—"} {selectedEdgeObj.target}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="edge-weight"
                      type="number"
                      inputMode="numeric"
                      value={weightDraft}
                      onChange={(e) => setWeightDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyWeight()}
                      disabled={!editable}
                    />
                    <Button onClick={applyWeight} disabled={!editable}>Set</Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={deleteSelection} disabled={!editable || (!selectedNode && !selectedEdge)}>
                  <Trash2 className="size-4" /> Delete selected
                </Button>
                <Button variant="outline" onClick={() => { update(emptyGraph()); setMessage({ kind: "info", text: "Graph cleared. Choose Add node and click the canvas." }); }} disabled={!editable}>
                  Clear graph
                </Button>
                <Button variant="outline" className="col-span-2" onClick={() => { update(sampleGraph(directed)); setSource("A"); setTarget("G"); setMessage(null); }} disabled={!editable}>
                  <Shapes className="size-4" /> Sample graph
                </Button>
              </div>
              <details className="rounded-md border border-border p-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium text-foreground">How to edit</summary>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li><b>Move</b>: drag nodes; tap a node or edge to select it (edges show their weight).</li>
                  <li><b>Add node</b>: tap empty canvas. Labels run A–Z (max 26).</li>
                  <li><b>Add edge</b>: tap the first node, then the second. Uses the weight above.</li>
                  <li><b>Delete</b>: tap a node or edge, or select it and press Delete.</li>
                  <li>Self-loops, duplicate edges, and negative or non-numeric weights are rejected.</li>
                  <li>Editing is locked while a run is in progress — press Reset to edit.</li>
                </ul>
              </details>
            </CardContent>
          </Card>

          <StatsCard
            ids={getCatalogEntry(algorithm.id).stats}
            values={{
              step: `${steps.length ? player.index + 1 : 0}/${steps.length}`,
              visited: step?.metrics.visited ?? 0,
              processed: step?.metrics.visited ?? 0,
              edgeChecks: step?.metrics.edgeChecks ?? 0,
              frontierOps: step?.metrics.frontierOps ?? 0,
              elapsed: player.elapsedMs,
              computeTime: mounted ? generationMs : null,
            }}
          />
          <ComplexityCard meta={getCatalogEntry(algorithm.id).complexity} />
          {algorithm.id === "dijkstra" && (
            <Alert>
              <AlertDescription className="text-xs">
                Negative weights are rejected. Dijkstra treats the closest unfinalized node as final; a negative edge found later could still shorten that path, so the result would be wrong. Use Bellman–Ford for negative weights.
              </AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            Keyboard: <kbd className="font-mono">Space</kbd> play/pause, <kbd className="font-mono">←</kbd>/<kbd className="font-mono">→</kbd> step, <kbd className="font-mono">R</kbd> restart, <kbd className="font-mono">Delete</kbd> remove selection, <kbd className="font-mono">Esc</kbd> cancel.
          </p>
        </aside>
      </div>
      <PlaybackBar player={player} totalSteps={steps.length} speed={speed} onSpeedChange={setSpeed} />
    </div>
  );
}
