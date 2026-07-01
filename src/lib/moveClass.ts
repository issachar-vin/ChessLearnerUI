import type { MoveClass } from "../types/chess";

// Label, short badge symbol, and colour for each Stockfish classification.
export const MOVE_CLASS_META: Record<MoveClass, { label: string; symbol: string; color: string }> =
  {
    brilliant: { label: "Brilliant", symbol: "!!", color: "#26c2a3" },
    great: { label: "Great", symbol: "!", color: "#749bbf" },
    best: { label: "Best", symbol: "★", color: "#81b64c" },
    excellent: { label: "Excellent", symbol: "✓", color: "#81b64c" },
    good: { label: "Good", symbol: "✓", color: "#a3c968" },
    inaccuracy: { label: "Inaccuracy", symbol: "?!", color: "#f7c631" },
    mistake: { label: "Mistake", symbol: "?", color: "#e58f2a" },
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
