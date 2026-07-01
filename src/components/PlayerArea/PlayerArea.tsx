import type { ReactNode } from "react";
import type { PieceType } from "../../types/chess";
import { PieceIcon } from "../PieceIcon/PieceIcon";
import { Tooltip } from "../Tooltip/Tooltip";
import { HELP } from "../Tooltip/help";

interface Props {
  name: string;
  subtitle?: string;
  icon: ReactNode;
  captured: PieceType[];
  capturedColor: "w" | "b";
  scoreDiff: number;
  isActive: boolean;
  fill?: boolean;
  autoPlay?: boolean;
  onToggleAutoPlay?: () => void;
}

function CapturedRow({
  captured,
  color,
  light,
}: {
  captured: PieceType[];
  color: "w" | "b";
  light: boolean;
}) {
  if (captured.length === 0) {
    return (
      <span className={`text-[11px] italic ${light ? "text-slate-500" : "text-slate-600"}`}>
        No captures yet
      </span>
    );
  }
  return (
    <span className="flex items-center">
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
  fill,
  autoPlay,
  onToggleAutoPlay,
}: Props) {
  // White pieces read fine on the dark card; the side capturing black pieces gets
  // a light card background so they stay legible, with text recoloured to match.
  const light = capturedColor === "b";
  const base = light ? "bg-slate-300 border-slate-400" : "bg-slate-800/40 border-slate-700/50";
  const active = isActive ? "border-purple-500/70 ring-2 ring-purple-500/40" : "";

  return (
    <div
      className={`rounded-lg border px-3 flex items-center gap-3 transition-colors ${base} ${active} ${
        fill ? "h-full min-h-[64px] py-3" : "w-full py-2"
      }`}
      style={{ width: "min(560px, 90vw)" }}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-sm truncate ${light ? "text-slate-900" : "text-white"}`}
          >
            {name}
          </span>
          {subtitle && (
            <span className={`text-[11px] ${light ? "text-slate-600" : "text-slate-500"}`}>
              {subtitle}
            </span>
          )}
          {isActive && (
            <span
              key={name}
              className={`text-base leading-none animate-knight-hop ${
                light ? "text-amber-600" : "text-amber-300"
              }`}
              title="Current turn"
            >
              ♞
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 h-5">
          <CapturedRow captured={captured} color={capturedColor} light={light} />
          {scoreDiff > 0 && (
            <span
              className={`text-[11px] font-semibold ${light ? "text-emerald-700" : "text-emerald-400"}`}
            >
              +{scoreDiff}
            </span>
          )}
        </div>
      </div>
      {onToggleAutoPlay && (
        <Tooltip {...HELP.autoplay}>
          <button
            onClick={onToggleAutoPlay}
            className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md border transition-colors ${
              autoPlay
                ? "bg-emerald-600 border-emerald-600 text-white"
                : light
                  ? "border-slate-500 text-slate-700 hover:bg-slate-400/50"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            {autoPlay ? "■ Auto" : "▶ Auto"}
          </button>
        </Tooltip>
      )}
    </div>
  );
}
