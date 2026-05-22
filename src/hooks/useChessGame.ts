import { Chess } from "chess.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { AnalyzeResponse, GameState, SquareHighlight } from "../types/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const COLORS = {
  legalMove: "rgba(127, 201, 127, 0.55)",
  legalCapture: "rgba(127, 201, 127, 0.85)",
  optimal: "rgba(155, 89, 182, 0.75)",
  counter: "rgba(231, 76, 60, 0.55)",
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
  const [squareHighlights, setSquareHighlights] = useState<SquareHighlight>({});
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [counteringEnabled, setCounteringEnabled] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const chessRef = useRef(new Chess());
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setSquareHighlights({});
    setSelectedSquare(null);
    setIsAiThinking(false);
  }, [openingId, userPlays]);

  // Fetch analysis whenever position changes and it's the player's turn
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
        return result;
      } catch {
        setAnalysis(null);
        return null;
      }
    },
    [openingId, counteringEnabled]
  );

  // Build square highlights from analysis + selected piece
  const buildHighlights = useCallback(
    (
      chess: Chess,
      fromSquare: string | null,
      currentAnalysis: AnalyzeResponse | null,
      lastAiMove: string | null
    ): SquareHighlight => {
      const highlights: SquareHighlight = {};

      // Last AI move hint
      if (lastAiMove) {
        const { from, to } = uciToSquares(lastAiMove);
        highlights[from] = { background: COLORS.lastMove };
        highlights[to] = { background: COLORS.lastMove };
      }

      // Optimal theory move (purple)
      if (currentAnalysis?.optimal_move) {
        const { to } = uciToSquares(currentAnalysis.optimal_move);
        highlights[to] = {
          background: COLORS.optimal,
          borderRadius: "50%",
        };
      }

      // Expected counter-move (red tint on opponent's piece)
      if (currentAnalysis?.counter_move) {
        const { from: cf, to: ct } = uciToSquares(currentAnalysis.counter_move);
        highlights[cf] = { background: COLORS.counter };
        highlights[ct] = { background: COLORS.counter };
      }

      // Legal moves for selected piece (green dots)
      if (fromSquare) {
        highlights[fromSquare] = { background: COLORS.selected };
        const legalForPiece = chess
          .moves({ square: fromSquare as Parameters<Chess["moves"]>[0]["square"], verbose: true })
          .map((m) => m.to);

        for (const sq of legalForPiece) {
          const isCapture = !!chess.get(sq as Parameters<Chess["get"]>[0]);
          highlights[sq] = {
            background: isCapture ? COLORS.legalCapture : COLORS.legalMove,
            borderRadius: isCapture ? "0%" : "50%",
          };
        }
      }

      return highlights;
    },
    []
  );

  // Trigger AI move after player moves
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

        // Small delay so the move feels natural
        aiTimeoutRef.current = setTimeout(() => {
          setGameState((prev) => {
            const chess = chessRef.current;
            try {
              chess.move({ from: result.move!.slice(0, 2), to: result.move!.slice(2, 4), promotion: "q" });
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
          // Refresh analysis after AI moves
          const state = chessRef.current;
          void fetchAnalysis(state.fen(), []);
        }, 500);
      } catch {
        setIsAiThinking(false);
      }
    },
    [openingId, counteringEnabled, fetchAnalysis]
  );

  // Called when player makes a move (drag drop or click)
  const onPlayerMove = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      const chess = chessRef.current;
      try {
        const move = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
        if (!move) return false;

        const newFen = chess.fen();
        const newUci = `${sourceSquare}${targetSquare}`;

        setGameState((prev) => {
          const newMoves = [...prev.movesPlayed, newUci];
          const newHistory = [...prev.moveHistory, { san: move.san, uci: newUci }];
          return {
            ...prev,
            fen: newFen,
            movesPlayed: newMoves,
            moveHistory: newHistory,
            isPlayerTurn: false,
            lastAiMove: null,
          };
        });

        setSelectedSquare(null);
        setSquareHighlights({});

        // Let AI respond
        const currentMoves = [...gameState.movesPlayed, newUci];
        void triggerAiMove(newFen, currentMoves);

        return true;
      } catch {
        return false;
      }
    },
    [gameState.movesPlayed, triggerAiMove]
  );

  // Called when piece drag begins — show legal moves + analysis highlights
  const onPieceDragBegin = useCallback(
    (_piece: string, sourceSquare: string) => {
      if (!gameState.isPlayerTurn) return;
      setSelectedSquare(sourceSquare);
      const highlights = buildHighlights(
        chessRef.current,
        sourceSquare,
        analysis,
        gameState.lastAiMove
      );
      setSquareHighlights(highlights);
    },
    [gameState.isPlayerTurn, gameState.lastAiMove, analysis, buildHighlights]
  );

  const onPieceDragEnd = useCallback(() => {
    setSelectedSquare(null);
    // Keep analysis highlights, clear legal-move dots
    const highlights = buildHighlights(chessRef.current, null, analysis, gameState.lastAiMove);
    setSquareHighlights(highlights);
  }, [analysis, gameState.lastAiMove, buildHighlights]);

  // Click-to-move: first click selects, second click moves
  const onSquareClick = useCallback(
    (square: string) => {
      if (!gameState.isPlayerTurn || isAiThinking) return;

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          const highlights = buildHighlights(chessRef.current, null, analysis, gameState.lastAiMove);
          setSquareHighlights(highlights);
          return;
        }
        const moved = onPlayerMove(selectedSquare, square);
        if (!moved) {
          // Might be selecting a different piece
          const piece = chessRef.current.get(square as Parameters<Chess["get"]>[0]);
          if (piece) {
            setSelectedSquare(square);
            const highlights = buildHighlights(chessRef.current, square, analysis, gameState.lastAiMove);
            setSquareHighlights(highlights);
          } else {
            setSelectedSquare(null);
            const highlights = buildHighlights(chessRef.current, null, analysis, gameState.lastAiMove);
            setSquareHighlights(highlights);
          }
        }
      } else {
        const piece = chessRef.current.get(square as Parameters<Chess["get"]>[0]);
        if (!piece) return;
        setSelectedSquare(square);
        const highlights = buildHighlights(chessRef.current, square, analysis, gameState.lastAiMove);
        setSquareHighlights(highlights);
      }
    },
    [
      gameState.isPlayerTurn,
      gameState.lastAiMove,
      isAiThinking,
      selectedSquare,
      analysis,
      onPlayerMove,
      buildHighlights,
    ]
  );

  // Refresh analysis whenever position changes and it's player's turn
  useEffect(() => {
    if (!openingId || !gameState.isPlayerTurn) return;
    void fetchAnalysis(gameState.fen, gameState.movesPlayed).then((result) => {
      if (result) {
        const highlights = buildHighlights(
          chessRef.current,
          selectedSquare,
          result,
          gameState.lastAiMove
        );
        setSquareHighlights(highlights);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.fen, gameState.isPlayerTurn, openingId, counteringEnabled]);

  // If user plays black, AI goes first
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
