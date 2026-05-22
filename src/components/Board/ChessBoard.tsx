import { Chessboard } from "react-chessboard";
import type { SquareHighlight } from "../../types/chess";

interface Props {
  fen: string;
  boardOrientation: "white" | "black";
  squareHighlights: SquareHighlight;
  optimalFromSquare: string | null;
  isPlayerTurn: boolean;
  isAiThinking: boolean;
  onPieceDrop: (source: string, target: string) => boolean;
  onPieceDragBegin: (piece: string, square: string) => void;
  onPieceDragEnd: (piece: string, square: string) => void;
  onSquareClick: (square: string) => void;
}

export function ChessBoard({
  fen,
  boardOrientation,
  squareHighlights,
  optimalFromSquare,
  isPlayerTurn,
  isAiThinking,
  onPieceDrop,
  onPieceDragBegin,
  onPieceDragEnd,
  onSquareClick,
}: Props) {
  // Inject a purple ring onto the piece that should move (the optimal move's from-square).
  // react-chessboard renders pieces as <img> tags inside a wrapper div per square;
  // we override the square style with a box-shadow ring on the piece's origin square.
  const mergedStyles = { ...squareHighlights };
  if (optimalFromSquare) {
    const existing = mergedStyles[optimalFromSquare] ?? {};
    mergedStyles[optimalFromSquare] = {
      ...existing,
      // Overlay a purple glow on the piece's source square
      background:
        existing.background && existing.background !== "transparent"
          ? existing.background
          : "rgba(155, 89, 182, 0.18)",
      boxShadow: "inset 0 0 0 4px rgba(155, 89, 182, 1)",
      borderRadius: "4px",
    };
  }

  return (
    <div className="relative">
      {isAiThinking && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm animate-pulse">
            Thinking...
          </div>
        </div>
      )}

      <div
        className={`rounded-lg overflow-hidden shadow-2xl transition-opacity duration-200 ${
          !isPlayerTurn || isAiThinking ? "opacity-90" : "opacity-100"
        }`}
        style={{ width: "min(560px, 90vw)" }}
      >
        <Chessboard
          position={fen}
          boardOrientation={boardOrientation}
          onPieceDrop={onPieceDrop}
          onPieceDragBegin={onPieceDragBegin}
          onPieceDragEnd={onPieceDragEnd}
          onSquareClick={onSquareClick}
          customSquareStyles={mergedStyles}
          arePiecesDraggable={isPlayerTurn && !isAiThinking}
          customBoardStyle={{
            borderRadius: "8px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
          customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
          customDarkSquareStyle={{ backgroundColor: "#b58863" }}
          animationDuration={250}
        />
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm border-2 border-green-400/85 inline-block" />
          Legal move
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm border-2 border-purple-500 inline-block" />
          Theory move
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm border-2 border-red-400/80 inline-block" />
          Expected counter
        </span>
      </div>
    </div>
  );
}
