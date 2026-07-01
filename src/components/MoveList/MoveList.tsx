import { useEffect, useRef } from "react";
import type { AnalyzeResponse, HistMove, MoveEntry, ReviewResponse } from "../../types/chess";
import { MOVE_CLASS_META, MOVE_CLASS_ORDER } from "../../lib/moveClass";
import { MoveIcon } from "../MoveIcon/MoveIcon";
import { Tooltip } from "../Tooltip/Tooltip";
import { HELP } from "../Tooltip/help";

interface Props {
  history: HistMove[];
  pointer: number;
  onJump: (ply: number) => void;
  analysis: AnalyzeResponse | null;
  guidedNext: MoveEntry | null;
  trainingName: string | null;
  canUndo: boolean;
  canRedo: boolean;
  nextIsAutoPlay: boolean;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
  onUndo: () => void;
  onRedo: () => void;
  review: ReviewResponse | null;
  analyzing: boolean;
  canAnalyze: boolean;
  onAnalyze: () => void;
}

export function MoveList({
  history,
  pointer,
  onJump,
  analysis,
  guidedNext,
  trainingName,
  canUndo,
  canRedo,
  nextIsAutoPlay,
  autoPlay,
  onToggleAutoPlay,
  onUndo,
  onRedo,
  review,
  analyzing,
  canAnalyze,
  onAnalyze,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length]);

  const pairs: Array<{ moveNum: number; white?: HistMove; black?: HistMove }> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ moveNum: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  const cell = (move: HistMove | undefined, index: number) => {
    if (!move) return <span className="w-16" />;
    const isCurrent = index + 1 === pointer;
    const cls = review?.moves[index]?.classification;
    const meta = cls && cls !== "unknown" ? MOVE_CLASS_META[cls] : null;
    return (
      <button
        onClick={() => onJump(index + 1)}
        style={meta ? { backgroundColor: `${meta.color}2b`, color: meta.color } : undefined}
        className={`w-16 font-mono rounded px-1 flex items-center justify-between gap-1 ${
          meta
            ? `font-semibold ${isCurrent ? "ring-1 ring-inset ring-white/60" : ""}`
            : isCurrent
              ? "bg-purple-600/40 text-white"
              : "text-slate-200 hover:bg-slate-700/50"
        }`}
      >
        <span className="truncate">{move.san}</span>
        {cls && meta && <MoveIcon cls={cls} size={14} />}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {(trainingName || analysis?.name) && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
              Opening
            </span>
            {analysis && !analysis.in_book && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">
                Off book
              </span>
            )}
          </div>
          {trainingName && <div className="text-white font-semibold text-sm">{trainingName}</div>}
          {analysis?.name && analysis.name !== trainingName && (
            <div className="text-slate-400 text-xs mt-1">
              Current:{" "}
              {analysis.eco && (
                <Tooltip {...HELP.eco}>
                  <span className="font-mono font-semibold text-slate-300 cursor-help border-b border-dotted border-slate-600">
                    {analysis.eco}
                  </span>
                </Tooltip>
              )}{" "}
              {analysis.name}
            </div>
          )}
        </div>
      )}

      {analysis && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Next move
          </div>
          <Hint label="Recommended" san={analysis.recommended.san} color="#10b981" />
          <Hint label="Guided" san={guidedNext?.san ?? null} color="#3b82f6" />
          <Hint label="Sparring" san={analysis.previews.sparring.san} color="#f59e0b" />
          <Hint label="Challenge" san={analysis.previews.challenge.san} color="#a855f7" />
        </div>
      )}

      <div className="bg-slate-800/60 rounded-lg border border-slate-700/50 flex-1 flex flex-col min-h-0">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider p-3 pb-2">
          Move History
        </div>
        <div className="flex-1 overflow-y-auto px-3 min-h-0">
          {pairs.length === 0 ? (
            <div className="text-slate-600 text-xs text-center py-4">Make your first move</div>
          ) : (
            <div className="space-y-0.5 text-sm">
              {pairs.map(({ moveNum, white, black }) => (
                <div key={moveNum} className="flex items-center gap-2">
                  <span className="text-slate-600 w-6 text-right shrink-0 text-xs">{moveNum}.</span>
                  {cell(white, (moveNum - 1) * 2)}
                  {cell(black, (moveNum - 1) * 2 + 1)}
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <Tooltip {...HELP.nav} className="w-full">
          <div className="flex w-full border-t border-slate-700/50">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Back"
              className="w-1/3 py-2 text-center text-slate-300 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ◀
            </button>
            <button
              onClick={onToggleAutoPlay}
              aria-label={autoPlay ? "Pause autoplay" : "Autoplay"}
              className={`w-1/3 py-2 text-center border-l border-slate-700/50 font-semibold ${
                autoPlay
                  ? "bg-emerald-600/90 text-white hover:bg-emerald-600"
                  : "text-emerald-400 hover:bg-emerald-500/15"
              }`}
            >
              {autoPlay ? "❚❚" : "▶"}
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo && !nextIsAutoPlay}
              aria-label={nextIsAutoPlay ? "Play autoplay move" : "Forward"}
              title={nextIsAutoPlay ? "Plays the autoplay move (not history)" : undefined}
              className={`w-1/3 py-2 text-center border-l border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed ${
                nextIsAutoPlay && !canRedo
                  ? "text-emerald-400 hover:bg-emerald-500/15"
                  : "text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              ▶❘
            </button>
          </div>
        </Tooltip>
      </div>

      {review ? (
        <ReviewSummary review={review} />
      ) : (
        canAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="rounded-lg py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors"
          >
            {analyzing ? "Analysing…" : "Analyse with Stockfish"}
          </button>
        )
      )}
    </div>
  );
}

function ReviewSummary({ review }: { review: ReviewResponse }) {
  if (!review.engine_available) {
    return (
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-xs text-slate-400">
        Stockfish is unavailable, so this game couldn't be analysed.
      </div>
    );
  }
  const counts = MOVE_CLASS_ORDER.map((c) => ({
    cls: c,
    n: review.moves.filter((m) => m.classification === c).length,
  })).filter((x) => x.n > 0);

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-2">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis</div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">
          White <span className="font-semibold text-white">{review.white_accuracy ?? "—"}%</span>
        </span>
        <span className="text-slate-300">
          Black <span className="font-semibold text-white">{review.black_accuracy ?? "—"}%</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {counts.map(({ cls, n }) => (
          <span
            key={cls}
            className="flex items-center gap-1 text-xs"
            title={MOVE_CLASS_META[cls].label}
          >
            <MoveIcon cls={cls} size={14} />
            <span className="font-semibold text-slate-200">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Hint({ label, san, color }: { label: string; san: string | null; color: string }) {
  if (!san) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-slate-300 text-xs">
        {label}: <span className="text-white font-mono font-semibold">{san}</span>
      </span>
    </div>
  );
}
