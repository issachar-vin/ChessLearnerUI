import type { ReactNode } from "react";
import type { PieceType } from "../../types/chess";
import { PieceIcon } from "../PieceIcon/PieceIcon";

interface Props {
  name: string;
  subtitle?: string;
  icon: ReactNode;
  captured: PieceType[];
  capturedColor: "w" | "b";
  scoreDiff: number;
  isActive: boolean;
}

function CapturedRow({ captured, color }: { captured: PieceType[]; color: "w" | "b" }) {
  if (captured.length === 0) {
    return <span className="text-[11px] text-slate-600 italic">No captures yet</span>;
  }
  // White pieces read fine on the dark card; black pieces need a lighter strip
  // behind the whole row (never per piece) to stay legible.
  return (
    <span className={`flex items-center rounded ${color === "b" ? "bg-slate-400" : ""}`}>
      {captured.map((p, i) => (
        <PieceIcon key={i} type={p} color={color} size={18} />
      ))}
    </span>
  );
}

export function PlayerArea({
  name,
  subtitle,
  icon,
  captured,
  capturedColor,
  scoreDiff,
  isActive,
}: Props) {
  return (
    <div
      className={`w-full rounded-lg border px-3 py-2 flex items-center gap-3 transition-colors ${
        isActive ? "border-purple-500/60 bg-purple-500/10" : "border-slate-700/50 bg-slate-800/40"
      }`}
      style={{ width: "min(560px, 90vw)" }}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm truncate">{name}</span>
          {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
          {isActive && (
            <span
              key={name}
              className="text-amber-300 text-base leading-none animate-knight-hop"
              title="Current turn"
            >
              ♞
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 h-5">
          <CapturedRow captured={captured} color={capturedColor} />
          {scoreDiff > 0 && (
            <span className="text-[11px] font-semibold text-emerald-400">+{scoreDiff}</span>
          )}
        </div>
      </div>
    </div>
  );
}
