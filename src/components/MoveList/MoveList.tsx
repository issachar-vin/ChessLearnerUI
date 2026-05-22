import { useEffect, useRef } from "react";
import type { AnalyzeResponse } from "../../types/chess";

interface Move {
  san: string;
  uci: string;
}

interface Props {
  moveHistory: Move[];
  analysis: AnalyzeResponse | null;
  isInOpening: boolean;
  openingName: string | null;
  openingDescription: string | null;
}

export function MoveList({ moveHistory, analysis, isInOpening, openingName, openingDescription }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moveHistory.length]);

  const pairs: Array<{ white?: Move; black?: Move; moveNum: number }> = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    pairs.push({
      moveNum: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1],
    });
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Opening info */}
      {openingName && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
              Opening
            </span>
            {!isInOpening && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">
                Off book
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-sm">{openingName}</div>
          {openingDescription && (
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{openingDescription}</p>
          )}
        </div>
      )}

      {/* Analysis hints */}
      {analysis && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hints</div>
          {analysis.optimal_move_san ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-300 text-xs">
                Theory: <span className="text-white font-mono font-semibold">{analysis.optimal_move_san}</span>
              </span>
            </div>
          ) : (
            <div className="text-slate-500 text-xs">{analysis.message ?? "No theory hint"}</div>
          )}
          {analysis.counter_move_san && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400 shrink-0" />
              <span className="text-slate-300 text-xs">
                Expected reply:{" "}
                <span className="text-white font-mono font-semibold">{analysis.counter_move_san}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Move history */}
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Move History
        </div>
        {pairs.length === 0 ? (
          <div className="text-slate-600 text-xs text-center py-4">
            Make your first move
          </div>
        ) : (
          <div className="space-y-0.5">
            {pairs.map(({ moveNum, white, black }) => (
              <div key={moveNum} className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 w-6 text-right shrink-0 text-xs">{moveNum}.</span>
                <span className="text-slate-200 font-mono w-14 shrink-0">{white?.san ?? ""}</span>
                <span className="text-slate-400 font-mono">{black?.san ?? ""}</span>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
