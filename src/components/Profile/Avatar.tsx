import type { ProfileIcon } from "../../types/chess";
import { PieceIcon } from "../PieceIcon/PieceIcon";

interface Props {
  icon: ProfileIcon;
  size: number;
  className?: string;
}

// Renders a profile icon — either an uploaded image or a board piece.
export function Avatar({ icon, size, className = "" }: Props) {
  const box = `inline-flex items-center justify-center shrink-0 rounded-full bg-slate-800 border border-slate-600 overflow-hidden ${className}`;
  if (icon.type === "image") {
    return (
      <span className={box} style={{ width: size, height: size }}>
        <img src={icon.src} alt="" className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <span className={box} style={{ width: size, height: size }}>
      <PieceIcon type={icon.piece} color="w" size={size * 0.78} />
    </span>
  );
}
