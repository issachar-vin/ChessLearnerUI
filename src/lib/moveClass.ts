import type { MoveClass } from "../types/chess";

// Label, short badge symbol, and colour for each Stockfish classification.
export const MOVE_CLASS_META: Record<MoveClass, { label: string; symbol: string; color: string }> =
  {
    brilliant: { label: "Brilliant", symbol: "!!", color: "#1cada6" },
    great: { label: "Great", symbol: "!", color: "#5b8bb0" },
    best: { label: "Best", symbol: "★", color: "#95bb4a" },
    excellent: { label: "Excellent", symbol: "✓", color: "#95bb4a" },
    good: { label: "Good", symbol: "·", color: "#9aa39b" },
    inaccuracy: { label: "Inaccuracy", symbol: "?!", color: "#f0c040" },
    mistake: { label: "Mistake", symbol: "?", color: "#e5892a" },
    blunder: { label: "Blunder", symbol: "??", color: "#ca3431" },
    unknown: { label: "", symbol: "", color: "#64748b" },
  };

// Order for a summary count, best → worst.
export const MOVE_CLASS_ORDER: MoveClass[] = [
  "brilliant",
  "great",
  "best",
  "excellent",
  "good",
  "inaccuracy",
  "mistake",
  "blunder",
];
