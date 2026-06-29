import { useEffect, useRef, useState } from "react";
import type { HistMove } from "../../types/chess";
import { computeDrawStatus } from "../../lib/draws";

interface Props {
  fen: string;
  history: HistMove[];
}

function barColor(ratio: number): string {
  if (ratio >= 0.85) return "bg-red-500";
  if (ratio >= 0.6) return "bg-amber-500";
  return "bg-slate-500";
}

function Rule({
  title,
  desc,
  count,
  max,
  unit,
  reset,
}: {
  title: string;
  desc: string;
  count: number;
  max: number;
  unit: string;
  reset?: boolean;
}) {
  const ratio = Math.min(1, count / max);
  const close = ratio >= 0.6;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">{title}</span>
        <span className="flex items-center gap-1.5">
          {reset && (
            <span className="text-[10px] text-emerald-300 bg-emerald-500/15 px-1 rounded animate-fade-in">
              reset
            </span>
          )}
          {close && !reset && (
            <span className="text-[10px] text-amber-300 bg-amber-500/15 px-1 rounded">close</span>
          )}
          <span className="text-[11px] font-mono text-slate-400">
            {count}/{max} {unit}
          </span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(ratio)}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-600 mt-0.5">{desc}</p>
    </div>
  );
}

export function DrawTracker({ fen, history }: Props) {
  const status = computeDrawStatus(fen, history);
  const fifty = status.fiftyMove.count;

  // Show a brief "reset" flag when the 50-move counter drops (a capture or
  // pawn move cleared it), so the player sees progress toward a draw undone.
  const prevFifty = useRef(fifty);
  const [justReset, setJustReset] = useState(false);
  useEffect(() => {
    const dropped = fifty < prevFifty.current && prevFifty.current > 0;
    prevFifty.current = fifty;
    if (dropped) {
      setJustReset(true);
      const t = setTimeout(() => setJustReset(false), 2500);
      return () => clearTimeout(t);
    }
  }, [fifty]);

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draw watch</div>

      <Rule
        title="50-move rule"
        desc="50 moves by each side with no capture or pawn move forces a draw."
        count={status.fiftyMove.count}
        max={status.fiftyMove.max}
        unit="ply"
        reset={justReset}
      />

      <Rule
        title="Threefold repetition"
        desc="The same position reached three times is a draw."
        count={status.threefold.count}
        max={status.threefold.max}
        unit="reps"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">Insufficient material</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            status.insufficientMaterial
              ? "bg-red-500/20 text-red-300"
              : "bg-slate-700/50 text-slate-500"
          }`}
        >
          {status.insufficientMaterial ? "draw — neither side can mate" : "not reached"}
        </span>
      </div>
    </div>
  );
}
