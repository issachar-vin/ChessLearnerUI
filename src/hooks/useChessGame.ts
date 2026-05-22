import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import type { AnalyzeResponse, GameState, SquareHighlight } from "../types/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Square outline styles (borders instead of filled circles)
const COLORS = {
  legalMove: "inset 0 0 0 3px rgba(127, 201, 127, 0.85)",
  legalCapture: "inset 0 0 0 4px rgba(80, 200, 80, 1)",
  optimal: "inset 0 0 0 4px rgba(155, 89, 182, 1)",
  counter: "inset 0 0 0 3px rgba(231, 76, 60, 0.8)",
  lastMove: "rgba(246, 246, 105, 0.45)",
  selected: "rgba(246, 246, 105, 0.65)",
};

function uciToSquares(uci: string): { from: string; to: string } {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

export function useChessGame(openingId: string | null, userPlays: "white" | "black") {
  const [gameState, setGameState] = useState<GameState>({
    fen: STARTING_FEN,
    movesPlayed: [],
    moveHistory: [],
    isPlayerTurn: userPlays === "white",
    isInOpening: true,
    openingMoveIndex: -1,
    lastAiMove: null,
    status: "idle",
  });

  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [counteringEnabled, setCounteringEnabled] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const chessRef = useRef(new Chess());
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Derived square highlights via useMemo ---
  // This is the key fix: highlights are always in sync with analysis + selection.
  // Nothing can drift because they're computed, not stored separately.
  const squareHighlights = useMemo((): SquareHighlight => {
    const highlights: SquareHighlight = {};
    const chess = chessRef.current;

    // Last AI move (yellow background)
    if (gameState.lastAiMove) {
      const { from, to } = uciToSquares(gameState.lastAiMove);
      highlights[from] = { background: COLORS.lastMove };
      highlights[to] = { background: COLORS.lastMove };
    }

    // Optimal theory / Stockfish move — purple outline on the destination square
    if (analysis?.optimal_move) {
      const { to } = uciToSquares(analysis.optimal_move);
      highlights[to] = { background: "transparent", boxShadow: COLORS.optimal };
    }

    // Expected counter — red outline on from+to squares
    if (analysis?.counter_move) {
      const { from: cf, to: ct } = uciToSquares(analysis.counter_move);
      highlights[cf] = { background: "transparent", boxShadow: COLORS.counter };
      highlights[ct] = { background: "transparent", boxShadow: COLORS.counter };
    }

    // Selected piece highlight
    if (selectedSquare) {
      highlights[selectedSquare] = { background: COLORS.selected };

      // Legal move destinations — square outline
      const legalForPiece = chess
        .moves({ square: selectedSquare as Parameters<Chess["moves"]>[0]["square"], verbose: true })
        .map((m) => m.to);

      for (const sq of legalForPiece) {
        const isCapture = !!chess.get(sq as Parameters<Chess["get"]>[0]);
        highlights[sq] = {
          background: "transparent",
          boxShadow: isCapture ? COLORS.legalCapture : COLORS.legalMove,
        };
      }
    }

    return highlights;
  }, [analysis, selectedSquare, gameState.lastAiMove]);

  // The piece the optimal move originates from — highlighted with purple ring in ChessBoard
  const optimalFromSquare = useMemo((): string | null => {
    if (!analysis?.optimal_move) return null;
    return analysis.optimal_move.slice(0, 2);
  }, [analysis]);

  // Reset when opening changes
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, userPlays]);

  const reset = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    chessRef.current = new Chess();
    setGameState({
      fen: STARTING_FEN,
      movesPlayed: [],
      moveHistory: [],
      isPlayerTurn: userPlays === "white",
      isInOpening: true,
      openingMoveIndex: -1,
      lastAiMove: null,
      status: openingId ? "playing" : "idle",
    });
    setAnalysis(null);
    setSelectedSquare(null);
    setIsAiThinking(false);
  }, [openingId, userPlays]);

  const fetchAnalysis = useCallback(
    async (fen: string, moves: string[]) => {
      if (!openingId) return;
      try {
        const result = await api.game.analyze({
          opening_id: openingId,
          fen,
          moves_played: moves,
          countering_enabled: counteringEnabled,
        });
        setAnalysis(result);
      } catch {
        setAnalysis(null);
      }
    },
    [openingId, counteringEnabled]
  );

  // Fetch analysis whenever position changes and it's the player's turn.
  // squareHighlights auto-updates via useMemo — no manual setSquareHighlights needed.
  useEffect(() => {
    if (!openingId || !gameState.isPlayerTurn) return;
    void fetchAnalysis(gameState.fen, gameState.movesPlayed);
  }, [gameState.fen, gameState.isPlayerTurn, gameState.movesPlayed, openingId, counteringEnabled, fetchAnalysis]);

  const triggerAiMove = useCallback(
    async (fen: string, moves: string[]) => {
      if (!openingId) return;
      setIsAiThinking(true);
      try {
        const result = await api.game.aiMove({
          opening_id: openingId,
          fen,
          moves_played: moves,
          countering_enabled: counteringEnabled,
        });

        if (!result.move) {
          setIsAiThinking(false);
          return;
        }

        aiTimeoutRef.current = setTimeout(() => {
          setGameState((prev) => {
            const chess = chessRef.current;
            try {
              chess.move({
                from: result.move!.slice(0, 2),
                to: result.move!.slice(2, 4),
                promotion: "q",
              });
            } catch {
              return prev;
            }
            const newFen = chess.fen();
            const newMoves = [...prev.movesPlayed, result.move!];
            const newHistory = [
              ...prev.moveHistory,
              { san: result.move_san ?? result.move!, uci: result.move! },
            ];
            return {
              ...prev,
              fen: newFen,
              movesPlayed: newMoves,
              moveHistory: newHistory,
              isPlayerTurn: true,
              lastAiMove: result.move,
              isInOpening: result.is_in_opening,
            };
          });
          setIsAiThinking(false);
        }, 500);
      } catch {
        setIsAiThinking(false);
      }
    },
    [openingId, counteringEnabled]
  );

  const onPlayerMove = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      const chess = chessRef.current;
      try {
        const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
        if (!move) return false;

        const newFen = chess.fen();
        const newUci = `${sourceSquare}${targetSquare}`;

        setGameState((prev) => {
          const newMoves = [...prev.movesPlayed, newUci];
          return {
            ...prev,
            fen: newFen,
            movesPlayed: newMoves,
            moveHistory: [...prev.moveHistory, { san: move.san, uci: newUci }],
            isPlayerTurn: false,
            lastAiMove: null,
          };
        });

        setSelectedSquare(null);
        setAnalysis(null); // clear stale hint immediately; new one loads after AI moves

        void triggerAiMove(newFen, [...gameState.movesPlayed, newUci]);
        return true;
      } catch {
        return false;
      }
    },
    [gameState.movesPlayed, triggerAiMove]
  );

  const onPieceDragBegin = useCallback(
    (_piece: string, sourceSquare: string) => {
      if (!gameState.isPlayerTurn) return;
      setSelectedSquare(sourceSquare);
    },
    [gameState.isPlayerTurn]
  );

  const onPieceDragEnd = useCallback(() => {
    setSelectedSquare(null);
  }, []);

  const onSquareClick = useCallback(
    (square: string) => {
      if (!gameState.isPlayerTurn || isAiThinking) return;

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }
        const moved = onPlayerMove(selectedSquare, square);
        if (!moved) {
          // Try selecting a different piece instead
          const piece = chessRef.current.get(square as Parameters<Chess["get"]>[0]);
          setSelectedSquare(piece ? square : null);
        }
      } else {
        const piece = chessRef.current.get(square as Parameters<Chess["get"]>[0]);
        if (piece) setSelectedSquare(square);
      }
    },
    [gameState.isPlayerTurn, isAiThinking, selectedSquare, onPlayerMove]
  );

  // If user plays black, trigger AI's first move
  useEffect(() => {
    if (
      openingId &&
      userPlays === "black" &&
      gameState.status === "playing" &&
      gameState.movesPlayed.length === 0 &&
      !isAiThinking
    ) {
      void triggerAiMove(STARTING_FEN, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, userPlays, gameState.status]);

  return {
    gameState,
    analysis,
    squareHighlights,
    optimalFromSquare,
    selectedSquare,
    counteringEnabled,
    isAiThinking,
    onPlayerMove,
    onPieceDragBegin,
    onPieceDragEnd,
    onSquareClick,
    setCounteringEnabled,
    reset,
  };
}
