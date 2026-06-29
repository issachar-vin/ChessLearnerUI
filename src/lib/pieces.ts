import type { PieceType } from "../types/chess";

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

// Pieces a player can pick as their profile icon, ordered from pawn to king.
export const SELECTABLE_PIECES: PieceType[] = ["p", "n", "b", "r", "q", "k"];

export const PIECE_LABELS: Record<PieceType, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};
