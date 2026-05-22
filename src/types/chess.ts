export interface MoveEntry {
  ply: number;
  san: string;
  uci: string;
  fen: string;
  comment: string | null;
  is_main_line: boolean;
}

export interface Opening {
  id: string;
  eco: string;
  name: string;
  description: string | null;
  pgn: string;
  user_plays: "white" | "black";
  moves: MoveEntry[];
  tags: string[];
}

export interface OpeningListItem {
  id: string;
  eco: string;
  name: string;
  description: string | null;
  user_plays: "white" | "black";
  tags: string[];
  move_count: number;
}

export interface AnalyzeResponse {
  is_in_opening: boolean;
  optimal_move: string | null;
  optimal_move_san: string | null;
  counter_move: string | null;
  counter_move_san: string | null;
  legal_moves: string[];
  opening_move_index: number;
  message: string | null;
}

export interface AIMoveResponse {
  move: string | null;
  move_san: string | null;
  is_in_opening: boolean;
}

export interface ImportOpeningRequest {
  pgn: string;
  eco?: string;
  name?: string;
  description?: string;
  user_plays: "white" | "black";
  tags: string[];
}

export type SquareHighlight = {
  [square: string]: { background?: string; borderRadius?: string; boxShadow?: string };
};

export interface GameState {
  fen: string;
  movesPlayed: string[];          // UCI moves
  moveHistory: { san: string; uci: string }[];
  isPlayerTurn: boolean;
  isInOpening: boolean;
  openingMoveIndex: number;
  lastAiMove: string | null;      // for post-move highlight
  status: "idle" | "playing" | "game-over";
}
