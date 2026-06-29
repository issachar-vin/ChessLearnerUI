import type { PieceType } from "../../types/chess";
import { pieceSvg } from "../../lib/pieceSvgs";

interface Props {
  type: PieceType;
  color: "w" | "b";
  size: number;
  className?: string;
}

// Renders the board's own piece artwork (react-chessboard's Cburnett SVGs).
export function PieceIcon({ type, color, size, className = "" }: Props) {
  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: pieceSvg(type, color) }}
    />
  );
}
