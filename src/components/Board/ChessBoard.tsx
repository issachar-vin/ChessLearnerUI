import { Chessboard } from "react-chessboard";
import { ARROW_COLORS, type GameResult } from "../../hooks/useChessGame";
import type { Side, SquareHighlight } from "../../types/chess";

interface Props {
  fen: string;
  boardOrientation: "white" | "black";
  squareHighlights: SquareHighlight;
  customArrows: [string, string, string][];
  isAiThinking: boolean;
  result: GameResult;
  winner: Side | null;
  onPieceDrop: (source: string, target: string) => boolean;
  onSquareClick: (square: string) => void;
}

function resultText(result: GameResult, winner: Side | null): { title: string; sub: string } | null {
  if (result === "checkmate")
    return { title: "Checkmate", sub: winner ? `${winner} wins` : "" };
  if (result === "stalemate") return { title: "Stalemate", sub: "Draw" };
  if (result === "draw") return { title: "Draw", sub: "" };
  return null;
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
  result,
  winner,
  onPieceDrop,
  onSquareClick,
}: Props) {
  const ended = resultText(result, winner);
  return (
    <div className="relative">
      {isAiThinking && !ended && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm animate-pulse">
            Thinking...
          </div>
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/85 border border-slate-600 rounded-xl px-8 py-5 text-center shadow-2xl backdrop-blur-sm animate-bounce-in">
            <div className="text-2xl font-bold text-white capitalize">{ended.title}</div>
            {ended.sub && <div className="text-sm text-slate-300 mt-1 capitalize">{ended.sub}</div>}
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
          areArrowsAllowed={false}
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
