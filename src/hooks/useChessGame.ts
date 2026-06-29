import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import type {
  AnalyzeResponse,
  HistMove,
  Mode,
  MoveEntry,
  Side,
  SquareHighlight,
} from "../types/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AI_MOVE_DELAY_MS = 350;

export const ARROW_COLORS: Record<"recommended" | Mode, string> = {
  recommended: "#10b981", // emerald — the move to play
  guided: "#3b82f6", // blue
  sparring: "#f59e0b", // amber
  challenge: "#a855f7", // purple
};

const SQUARE_COLORS = {
  legalMove: "inset 0 0 0 3px rgba(127, 201, 127, 0.85)",
  legalCapture: "inset 0 0 0 4px rgba(80, 200, 80, 1)",
  lastMove: "rgba(246, 246, 105, 0.45)",
  selected: "rgba(246, 246, 105, 0.65)",
  check: "rgba(239, 68, 68, 0.55)",
};

export type GameResult = "checkmate" | "stalemate" | "draw" | null;

function findKing(chess: Chess, color: "w" | "b"): string | null {
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === "k" && cell.color === color) return cell.square;
    }
  }
  return null;
}

export interface PreviewVisibility {
  recommended: boolean;
  guided: boolean;
  sparring: boolean;
  challenge: boolean;
}

type Sq = Parameters<Chess["get"]>[0];

function uciFromTo(uci: string): { from: string; to: string } {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

function buildBoard(history: HistMove[], upto: number): Chess {
  const chess = new Chess();
  for (let i = 0; i < upto; i++) {
    const { from, to } = uciFromTo(history[i].uci);
    chess.move({ from, to, promotion: history[i].uci.slice(4, 5) || "q" });
  }
  return chess;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useChessGame(
  openingId: string | null,
  mode: Mode,
  strict: boolean,
  userSide: Side,
  lineMoves: MoveEntry[],
) {
  // Refs are the source of truth; `snapshot` is the render projection of them.
  const chessRef = useRef(new Chess());
  const historyRef = useRef<HistMove[]>([]);
  const pointerRef = useRef(0);
  // Guards against a slow/stale analyze response overwriting a newer one.
  const analysisSeq = useRef(0);

  const [snapshot, setSnapshot] = useState({
    fen: STARTING_FEN,
    turn: "w" as "w" | "b",
    pointer: 0,
    length: 0,
    lastMove: null as string | null,
    inCheck: false,
    checkedKingSquare: null as string | null,
    result: null as GameResult,
  });
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [previewVisibility, setPreviewVisibility] = useState<PreviewVisibility>({
    recommended: true,
    guided: false,
    sparring: false,
    challenge: false,
  });

  // Mirror the latest props into a ref so move handlers never read stale values.
  const cfg = useRef({ openingId, mode, strict, userSide, analysis });
  cfg.current = { openingId, mode, strict, userSide, analysis };

  const userChar = userSide === "white" ? "w" : "b";

  const sync = useCallback((lastMove: string | null) => {
    const chess = chessRef.current;
    const inCheck = chess.inCheck();
    let result: GameResult = null;
    if (chess.isCheckmate()) result = "checkmate";
    else if (chess.isStalemate()) result = "stalemate";
    else if (chess.isDraw()) result = "draw";
    setSnapshot({
      fen: chess.fen(),
      turn: chess.turn(),
      pointer: pointerRef.current,
      length: historyRef.current.length,
      lastMove,
      inCheck,
      checkedKingSquare: inCheck ? findKing(chess, chess.turn()) : null,
      result,
    });
  }, []);

  const fetchAnalysis = useCallback(async () => {
    if (!cfg.current.openingId) return;
    const seq = ++analysisSeq.current;
    const moves = historyRef.current.slice(0, pointerRef.current).map((m) => m.uci);
    try {
      const res = await api.game.analyze({
        fen: chessRef.current.fen(),
        moves_played: moves,
        opening_id: cfg.current.openingId,
      });
      if (seq === analysisSeq.current) setAnalysis(res);
    } catch {
      if (seq === analysisSeq.current) setAnalysis(null);
    }
  }, []);

  const triggerAiMove = useCallback(async () => {
    const { openingId: oid, mode: m } = cfg.current;
    const fen = chessRef.current.fen();
    const moves = historyRef.current.slice(0, pointerRef.current).map((mm) => mm.uci);
    setIsAiThinking(true);
    try {
      const res = await api.game.aiMove({
        fen,
        moves_played: moves,
        mode: m,
        opening_id: oid,
      });
      if (!res.move) {
        setIsAiThinking(false);
        return;
      }
      await sleep(AI_MOVE_DELAY_MS);
      const applied = chessRef.current.move({
        from: res.move.slice(0, 2),
        to: res.move.slice(2, 4),
        promotion: res.move.slice(4, 5) || "q",
      });
      if (!applied) {
        setIsAiThinking(false);
        return;
      }
      historyRef.current = historyRef.current.slice(0, pointerRef.current);
      historyRef.current.push({ san: applied.san, uci: applied.lan });
      pointerRef.current += 1;
      setIsAiThinking(false);
      sync(applied.lan);
    } catch {
      setIsAiThinking(false);
    }
  }, [sync]);

  const reset = useCallback(() => {
    chessRef.current = new Chess();
    historyRef.current = [];
    pointerRef.current = 0;
    setAnalysis(null);
    setSelectedSquare(null);
    setIsAiThinking(false);
    sync(null);
    // If the learner plays the second-moving side, the opponent opens the game.
    if (openingId && chessRef.current.turn() !== userChar) {
      void triggerAiMove();
    }
  }, [openingId, userChar, sync, triggerAiMove]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, userSide]);

  // Refresh hints/previews whenever it lands on the learner's turn.
  useEffect(() => {
    if (!openingId || isAiThinking) return;
    if (snapshot.turn !== userChar) return;
    void fetchAnalysis();
  }, [snapshot.fen, snapshot.turn, openingId, isAiThinking, userChar, fetchAnalysis]);

  const applyMove = useCallback(
    (from: string, to: string): boolean => {
      if (isAiThinking) return false;
      const movedSide = chessRef.current.turn();
      const { mode: m, strict: s, analysis: a } = cfg.current;

      if (m === "guided" && s && movedSide === userChar) {
        const lineUci = a?.previews.guided.uci;
        if (lineUci && `${from}${to}` !== lineUci) {
          toast("Off the line — follow the highlighted move");
          return false;
        }
      }

      let applied;
      try {
        applied = chessRef.current.move({ from, to, promotion: "q" });
      } catch {
        return false;
      }
      if (!applied) return false;

      historyRef.current = historyRef.current.slice(0, pointerRef.current);
      historyRef.current.push({ san: applied.san, uci: applied.lan });
      pointerRef.current += 1;
      analysisSeq.current++;
      setSelectedSquare(null);
      setAnalysis(null);
      sync(applied.lan);

      // The opponent only replies when the learner moves their own colour.
      if (movedSide === userChar) {
        void triggerAiMove();
      }
      return true;
    },
    [isAiThinking, userChar, sync, triggerAiMove],
  );

  const navigate = useCallback(
    (to: number) => {
      const clamped = Math.max(0, Math.min(historyRef.current.length, to));
      chessRef.current = buildBoard(historyRef.current, clamped);
      pointerRef.current = clamped;
      analysisSeq.current++;
      setSelectedSquare(null);
      setAnalysis(null);
      sync(clamped > 0 ? historyRef.current[clamped - 1].uci : null);
    },
    [sync],
  );

  const undo = useCallback(() => navigate(pointerRef.current - 1), [navigate]);
  const redo = useCallback(() => navigate(pointerRef.current + 1), [navigate]);
  const jumpTo = useCallback((ply: number) => navigate(ply), [navigate]);

  const onPieceDrop = useCallback(
    (source: string, target: string) => applyMove(source, target),
    [applyMove],
  );

  const onSquareClick = useCallback(
    (square: string) => {
      if (isAiThinking) return;
      const piece = chessRef.current.get(square as Sq);
      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }
        const moved = applyMove(selectedSquare, square);
        if (!moved) {
          setSelectedSquare(piece && piece.color === chessRef.current.turn() ? square : null);
        }
      } else if (piece && piece.color === chessRef.current.turn()) {
        setSelectedSquare(square);
      }
    },
    [isAiThinking, selectedSquare, applyMove],
  );

  const squareHighlights = useMemo((): SquareHighlight => {
    const highlights: SquareHighlight = {};
    if (snapshot.lastMove) {
      const { from, to } = uciFromTo(snapshot.lastMove);
      highlights[from] = { background: SQUARE_COLORS.lastMove };
      highlights[to] = { background: SQUARE_COLORS.lastMove };
    }
    if (snapshot.checkedKingSquare) {
      highlights[snapshot.checkedKingSquare] = { background: SQUARE_COLORS.check };
    }
    if (selectedSquare) {
      highlights[selectedSquare] = { background: SQUARE_COLORS.selected };
      const legal = chessRef.current
        .moves({ square: selectedSquare as Sq, verbose: true })
        .map((mv) => mv.to);
      for (const sq of legal) {
        const isCapture = !!chessRef.current.get(sq as Sq);
        highlights[sq] = {
          background: "transparent",
          boxShadow: isCapture ? SQUARE_COLORS.legalCapture : SQUARE_COLORS.legalMove,
        };
      }
    }
    return highlights;
  }, [snapshot.lastMove, snapshot.checkedKingSquare, selectedSquare]);

  const previewArrows = useMemo((): [string, string, string][] => {
    if (!analysis) return [];
    // Only suggest a move that is actually legal in the current position, so a
    // momentarily-stale hint can never point at a piece that has already moved.
    const legal = new Set(
      new Chess(snapshot.fen).moves({ verbose: true }).map((mv) => `${mv.from}${mv.to}`),
    );
    const arrows: [string, string, string][] = [];
    const add = (uci: string | null, color: string) => {
      if (uci && legal.has(uci.slice(0, 4))) {
        arrows.push([uci.slice(0, 2), uci.slice(2, 4), color]);
      }
    };
    if (previewVisibility.sparring) add(analysis.previews.sparring.uci, ARROW_COLORS.sparring);
    if (previewVisibility.challenge) add(analysis.previews.challenge.uci, ARROW_COLORS.challenge);
    // Recommended and Guided share one slot: Recommended (the smart hint) wins
    // when shown; otherwise Guided draws the selected line's move for the current
    // ply — even after deviating — but only if it is still legal here.
    if (previewVisibility.recommended) {
      add(analysis.recommended.uci, ARROW_COLORS.recommended);
    } else if (previewVisibility.guided) {
      add(lineMoves[snapshot.pointer]?.uci ?? null, ARROW_COLORS.guided);
    }
    return arrows;
  }, [analysis, previewVisibility, snapshot.fen, snapshot.pointer, lineMoves]);

  const isUserTurn = snapshot.turn === userChar;
  const winner: Side | null =
    snapshot.result === "checkmate" ? (snapshot.turn === "w" ? "black" : "white") : null;

  return {
    fen: snapshot.fen,
    history: historyRef.current,
    pointer: snapshot.pointer,
    length: snapshot.length,
    isUserTurn,
    sideToMove: snapshot.turn,
    inCheck: snapshot.inCheck,
    result: snapshot.result,
    winner,
    isAiThinking,
    analysis,
    squareHighlights,
    previewArrows,
    previewVisibility,
    setPreviewVisibility,
    canUndo: snapshot.pointer > 0,
    canRedo: snapshot.pointer < snapshot.length,
    onPieceDrop,
    onSquareClick,
    undo,
    redo,
    jumpTo,
    reset,
  };
}
