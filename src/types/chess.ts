export type Mode = "guided" | "sparring" | "challenge";
export type Side = "white" | "black";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type ProfileIcon = { type: "piece"; piece: PieceType } | { type: "image"; src: string };

export interface Profile {
  name: string;
  icon: ProfileIcon;
}

export interface MoveEntry {
  ply: number;
  san: string;
  uci: string;
  fen: string;
}

export interface OpeningListItem {
  id: string;
  eco: string;
  name: string;
  move_count: number;
}

export interface Opening {
  id: string;
  eco: string;
  name: string;
  pgn: string;
  moves: MoveEntry[];
}

export interface MoveOption {
  uci: string | null;
  san: string | null;
}

export interface ModePreviews {
  guided: MoveOption;
  sparring: MoveOption;
  challenge: MoveOption;
}

export interface AnalyzeResponse {
  recommended: MoveOption;
  previews: ModePreviews;
  legal_moves: string[];
  on_line: boolean;
  in_book: boolean;
  eco: string | null;
  name: string | null;
}

export interface AIMoveResponse {
  move: string | null;
  move_san: string | null;
  previews: ModePreviews;
  on_line: boolean;
  in_book: boolean;
  eco: string | null;
  name: string | null;
}

export interface HistMove {
  san: string;
  uci: string;
}

export type MoveClass =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "unknown";

export interface MoveReview {
  ply: number;
  uci: string;
  san: string | null;
  classification: MoveClass;
  cpl: number;
  best_uci: string | null;
  best_san: string | null;
}

export interface ReviewResponse {
  engine_available: boolean;
  moves: MoveReview[];
  white_accuracy: number | null;
  black_accuracy: number | null;
}

export type SquareHighlight = {
  [square: string]: { background?: string; borderRadius?: string; boxShadow?: string };
};
