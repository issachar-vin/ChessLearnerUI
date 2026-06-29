export type Mode = "guided" | "sparring" | "challenge";
export type Side = "white" | "black";

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

export type SquareHighlight = {
  [square: string]: { background?: string; borderRadius?: string; boxShadow?: string };
};
