import type { MoveClass } from "../../types/chess";
import { MOVE_CLASS_META } from "../../lib/moveClass";

interface Props {
  cls: MoveClass;
  size?: number;
}

// A chess.com-style badge: a colored disc with the symbol in white.
export function MoveIcon({ cls, size = 15 }: Props) {
  const meta = MOVE_CLASS_META[cls];
  if (!meta.symbol) return null;
  const fontSize = meta.symbol.length >= 2 ? 9 : 13;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className="shrink-0"
      aria-label={meta.label}
    >
      <circle cx="10" cy="10" r="10" fill={meta.color} />
      <text
        x="10"
        y="10.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {meta.symbol}
      </text>
    </svg>
  );
}
