import type { PieceType } from "../types/chess";
import { PIECE_VALUES } from "./pieces";

const STARTING_COUNT: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

const CAPTURABLE: PieceType[] = ["p", "n", "b", "r", "q"];

export interface CaptureSummary {
  // Pieces each side has captured, sorted by value ascending (pawn → queen).
  byWhite: PieceType[];
  byBlack: PieceType[];
  whiteScore: number;
  blackScore: number;
}

function countPieces(placement: string): {
  white: Record<string, number>;
  black: Record<string, number>;
} {
  const white: Record<string, number> = {};
  const black: Record<string, number> = {};
  for (const ch of placement) {
    if (ch >= "a" && ch <= "z") black[ch] = (black[ch] ?? 0) + 1;
    else if (ch >= "A" && ch <= "Z") {
      const lower = ch.toLowerCase();
      white[lower] = (white[lower] ?? 0) + 1;
    }
  }
  return { white, black };
}

function missing(present: Record<string, number>): PieceType[] {
  const result: PieceType[] = [];
  for (const type of CAPTURABLE) {
    // Promotions can leave more pieces than the start (e.g. a 2nd queen), which
    // would otherwise read as a negative count — clamp so it never goes below 0.
    const taken = Math.max(0, STARTING_COUNT[type] - (present[type] ?? 0));
    for (let i = 0; i < taken; i++) result.push(type);
  }
  return result.sort((a, b) => PIECE_VALUES[a] - PIECE_VALUES[b]);
}

function score(pieces: PieceType[]): number {
  return pieces.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
}

export function computeCaptures(fen: string): CaptureSummary {
  const placement = fen.split(" ")[0];
  const { white, black } = countPieces(placement);
  // White captured the black pieces that are missing, and vice versa.
  const byWhite = missing(black);
  const byBlack = missing(white);
  return {
    byWhite,
    byBlack,
    whiteScore: score(byWhite),
    blackScore: score(byBlack),
  };
}
