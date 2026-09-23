import type { Cell } from "./grid";

export type HeuristicId = "manhattan" | "euclidean";

export interface HeuristicDefinition {
  id: HeuristicId;
  name: string;
  formula: string;
  notes: string;
  fn: (a: Cell, b: Cell) => number;
}

export const heuristics: Record<HeuristicId, HeuristicDefinition> = {
  manhattan: {
    id: "manhattan",
    name: "Manhattan",
    formula: "h = |Δrow| + |Δcol|",
    notes:
      "Exact distance on an empty 4-directional unit-cost grid, so it is admissible and consistent — the tightest valid estimate here. A* returns an optimal path.",
    fn: (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col),
  },
  euclidean: {
    id: "euclidean",
    name: "Euclidean",
    formula: "h = √(Δrow² + Δcol²)",
    notes:
      "Straight-line distance never exceeds the 4-directional distance, so it is still admissible and consistent (paths stay optimal), but it underestimates more and usually expands more cells than Manhattan.",
    fn: (a, b) => Math.hypot(a.row - b.row, a.col - b.col),
  },
};
