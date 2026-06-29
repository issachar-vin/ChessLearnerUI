import { Chessboard } from "react-chessboard";
import { ARROW_COLORS } from "../../hooks/useChessGame";
import type { SquareHighlight } from "../../types/chess";

interface Props {
  fen: string;
  boardOrientation: "white" | "black";
  squareHighlights: SquareHighlight;
  customArrows: [string, string, string][];
  isAiThinking: boolean;
  onPieceDrop: (source: string, target: string) => boolean;
  onSquareClick: (square: string) => void;
}

const LEGEND: { color: string; label: string }[] = [
  { color: ARROW_COLORS.recommended, label: "Recommended" },
  { color: ARROW_COLORS.guided, label: "Guided" },
  { color: ARROW_COLORS.sparring, label: "Sparring" },
  { color: ARROW_COLORS.challenge, label: "Challenge" },
];

export function ChessBoard({
  fen,
  boardOrientation,
  squareHighlights,
  customArrows,
  isAiThinking,
  onPieceDrop,
  onSquareClick,
}: Props) {
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
        className="rounded-lg overflow-hidden shadow-2xl"
        style={{ width: "min(560px, 90vw)" }}
      >
        <Chessboard
          position={fen}
          boardOrientation={boardOrientation}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          customSquareStyles={squareHighlights}
          customArrows={customArrows as never}
          arePiecesDraggable={!isAiThinking}
          customBoardStyle={{
            borderRadius: "8px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
          customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
          customDarkSquareStyle={{ backgroundColor: "#b58863" }}
          animationDuration={250}
        />
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-0 border-t-2"
              style={{ borderColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
