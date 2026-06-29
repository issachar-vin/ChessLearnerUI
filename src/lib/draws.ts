import { Chess } from "chess.js";
import type { HistMove } from "../types/chess";

// 50-move rule: a draw can be claimed after 50 moves by each side (100 half-moves)
// with no capture or pawn move. Threefold: same position reached three times.
export const FIFTY_MOVE_PLIES = 100;
export const REPETITION_TARGET = 3;

export interface DrawStatus {
  fiftyMove: { count: number; max: number };
  threefold: { count: number; max: number };
  insufficientMaterial: boolean;
}

// The repetition key is the part of a FEN that defines a position for
// repetition purposes: placement, side to move, castling rights, en passant.
function repetitionKey(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

function uciFromTo(uci: string): { from: string; to: string; promotion: string } {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || "q" };
}

function repetitionCount(history: HistMove[]): number {
  const chess = new Chess();
  const counts = new Map<string, number>();
  const tally = () => {
    const key = repetitionKey(chess.fen());
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  tally();
  for (const move of history) {
    const { from, to, promotion } = uciFromTo(move.uci);
    chess.move({ from, to, promotion });
    tally();
  }
  return counts.get(repetitionKey(chess.fen())) ?? 1;
}

// `history` must already be sliced to the position being shown (board pointer).
export function computeDrawStatus(fen: string, history: HistMove[]): DrawStatus {
  const halfmove = Number.parseInt(fen.split(" ")[4] ?? "0", 10) || 0;
  return {
    fiftyMove: { count: halfmove, max: FIFTY_MOVE_PLIES },
    threefold: { count: repetitionCount(history), max: REPETITION_TARGET },
    insufficientMaterial: new Chess(fen).isInsufficientMaterial(),
  };
}
