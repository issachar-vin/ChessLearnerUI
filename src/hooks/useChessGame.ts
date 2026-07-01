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

const AUTOPLAY_DELAY_MS = 450;

export function useChessGame(
  openingId: string | null,
  mode: Mode,
  strict: boolean,
  userSide: Side,
  lineMoves: MoveEntry[],
  aiOpeningId: string | null,
  freePlay: boolean
) {
  // Refs are the source of truth; `snapshot` is the render projection of them.
  const chessRef = useRef(new Chess());
  const historyRef = useRef<HistMove[]>([]);
  const pointerRef = useRef(0);
  // Guards against a slow/stale analyze response overwriting a newer one.
  const analysisSeq = useRef(0);
  // Latest move autoplay/▶ would make for the learner (line step, else the hint).
  const autoPlayMoveRef = useRef<string | null>(null);
  // Set when a PGN was just loaded so the reset effect doesn't wipe it.
  const pendingLoadRef = useRef(false);
  // The board is live when an opening is selected or free play / a PGN is loaded.
  const active = openingId !== null || freePlay;

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
  const [autoPlay, setAutoPlay] = useState(false);

  // Mirror the latest props into a ref so move handlers never read stale values.
  const cfg = useRef({ openingId, mode, strict, userSide, aiOpeningId, analysis });
  cfg.current = { openingId, mode, strict, userSide, aiOpeningId, analysis };

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
    // Called only when the board is active; opening_id may be null (free play).
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
    const { openingId: oid, mode: m, aiOpeningId: aoid } = cfg.current;
    const fen = chessRef.current.fen();
    const moves = historyRef.current.slice(0, pointerRef.current).map((mm) => mm.uci);
    setIsAiThinking(true);
    try {
      const res = await api.game.aiMove({
        fen,
        moves_played: moves,
        mode: m,
        opening_id: oid,
        ai_opening_id: aoid,
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
    if (active && chessRef.current.turn() !== userChar) {
      void triggerAiMove();
    }
  }, [active, userChar, sync, triggerAiMove]);

  // Load a game (e.g. from a PGN) for replay/analysis: history is set, the board
  // sits at the start so ◀ ▶ step through it. No AI reply is triggered.
  const loadGame = useCallback(
    (uciMoves: string[]) => {
      const chess = new Chess();
      const hist: HistMove[] = [];
      for (const uci of uciMoves) {
        try {
          const applied = chess.move({
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            promotion: uci.slice(4, 5) || "q",
          });
          if (!applied) break;
          hist.push({ san: applied.san, uci: applied.lan });
        } catch {
          break;
        }
      }
      chessRef.current = new Chess();
      historyRef.current = hist;
      pointerRef.current = 0;
      analysisSeq.current++;
      pendingLoadRef.current = true;
      setAnalysis(null);
      setSelectedSquare(null);
      setIsAiThinking(false);
      sync(null);
    },
    [sync]
  );

  useEffect(() => {
    if (pendingLoadRef.current) {
      pendingLoadRef.current = false;
      return;
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, userSide, freePlay]);

  // Refresh hints/previews whenever it lands on the learner's turn.
  useEffect(() => {
    if (!active || isAiThinking) return;
    if (snapshot.turn !== userChar) return;
    void fetchAnalysis();
  }, [snapshot.fen, snapshot.turn, active, isAiThinking, userChar, fetchAnalysis]);

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
    [isAiThinking, userChar, sync, triggerAiMove]
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
    [sync]
  );

  const undo = useCallback(() => navigate(pointerRef.current - 1), [navigate]);
  // At the live tip, ▶ plays the move autoplay would make rather than navigating
  // forward — letting the learner step the opening one move at a time.
  const redo = useCallback(() => {
    if (pointerRef.current < historyRef.current.length) {
      navigate(pointerRef.current + 1);
      return;
    }
    const uci = autoPlayMoveRef.current;
    if (uci) applyMove(uci.slice(0, 2), uci.slice(2, 4));
  }, [navigate, applyMove]);
  const jumpTo = useCallback((ply: number) => navigate(ply), [navigate]);

  const onPieceDrop = useCallback(
    (source: string, target: string) => applyMove(source, target),
    [applyMove]
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
    [isAiThinking, selectedSquare, applyMove]
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

  // The guided preview follows the learner's *progress* through the opening so a
  // deviation never skips the step that was missed. A cursor walks the line:
  // - an opponent-colour line move is passed as soon as the opponent moves (the
  //   learner never replays it, and off-line the opponent won't match it), and
  // - a learner-colour line move is passed only when the learner plays it exactly,
  //   so deviating leaves the cursor parked on the move to play.
  // The game always starts from the initial position, so colour follows parity:
  // line move `c` and history move `i` are White when even, Black when odd.
  const guidedNext = useMemo((): MoveEntry | null => {
    const hist = historyRef.current;
    let cursor = 0;
    for (let i = 0; i < snapshot.pointer && cursor < lineMoves.length; i++) {
      const lineIsLearner = (cursor % 2 === 0 ? "w" : "b") === userChar;
      const playedIsLearner = (i % 2 === 0 ? "w" : "b") === userChar;
      if (!lineIsLearner) {
        if (!playedIsLearner) cursor++;
      } else if (playedIsLearner && hist[i].uci.slice(0, 4) === lineMoves[cursor].uci.slice(0, 4)) {
        cursor++;
      }
    }
    return lineMoves[cursor] ?? null;
  }, [snapshot.pointer, lineMoves, userChar]);

  const previewArrows = useMemo((): [string, string, string][] => {
    if (!analysis) return [];
    // Only suggest a move that is actually legal in the current position, so a
    // momentarily-stale hint can never point at a piece that has already moved.
    const legal = new Set(
      new Chess(snapshot.fen).moves({ verbose: true }).map((mv) => `${mv.from}${mv.to}`)
    );
    const arrows: [string, string, string][] = [];
    const add = (uci: string | null, color: string) => {
      if (uci && legal.has(uci.slice(0, 4))) {
        arrows.push([uci.slice(0, 2), uci.slice(2, 4), color]);
      }
    };
    // Recommended tracks the line by board ply and falls back to the engine hint
    // once that move is gone; Guided tracks the progress cursor (`guidedNext`).
    const recUci = lineMoves[snapshot.pointer]?.uci ?? null;
    const recLegal = !!recUci && legal.has(recUci.slice(0, 4));

    if (previewVisibility.sparring) add(analysis.previews.sparring.uci, ARROW_COLORS.sparring);
    if (previewVisibility.challenge) add(analysis.previews.challenge.uci, ARROW_COLORS.challenge);
    if (previewVisibility.recommended) {
      add(recLegal ? recUci : analysis.recommended.uci, ARROW_COLORS.recommended);
    } else if (previewVisibility.guided) {
      add(guidedNext?.uci ?? null, ARROW_COLORS.guided);
    }
    return arrows;
  }, [analysis, previewVisibility, snapshot.fen, snapshot.pointer, lineMoves, guidedNext]);

  const isUserTurn = snapshot.turn === userChar;

  // The move autoplay (and the ▶ step) makes for the learner: the opening-line
  // step while it's legal, else the engine-backed recommendation — so a divergent
  // opponent can never park it on an illegal move, and it keeps playing past the
  // end of the line. Null only when there's no move at all (game over / no analysis).
  const autoPlayMove = useMemo(() => {
    const line = guidedNext?.uci ?? null;
    const rec = analysis?.recommended.uci ?? null;
    if (!line) return rec;
    const legal = new Set(
      new Chess(snapshot.fen).moves({ verbose: true }).map((mv) => `${mv.from}${mv.to}`)
    );
    return legal.has(line.slice(0, 4)) ? line : rec;
  }, [guidedNext, analysis, snapshot.fen]);
  autoPlayMoveRef.current = autoPlayMove;
  const atTip = snapshot.pointer >= snapshot.length;
  const nextIsAutoPlay = atTip && isUserTurn && !isAiThinking && !snapshot.result && !!autoPlayMove;

  // Autoplay: keep making the learner's move at the live tip so the opening plays
  // itself out; toggling off hands control back for a custom move.
  useEffect(() => {
    if (!autoPlay || !nextIsAutoPlay || !autoPlayMove) return;
    const t = setTimeout(
      () => applyMove(autoPlayMove.slice(0, 2), autoPlayMove.slice(2, 4)),
      AUTOPLAY_DELAY_MS
    );
    return () => clearTimeout(t);
  }, [autoPlay, nextIsAutoPlay, autoPlayMove, applyMove]);

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
    guidedNext,
    squareHighlights,
    previewArrows,
    previewVisibility,
    setPreviewVisibility,
    canUndo: snapshot.pointer > 0,
    canRedo: snapshot.pointer < snapshot.length,
    autoPlay,
    setAutoPlay,
    nextIsAutoPlay,
    onPieceDrop,
    onSquareClick,
    undo,
    redo,
    jumpTo,
    reset,
    loadGame,
  };
}
