import { Fragment, useEffect, useRef } from "react";
import type {
  AnalyzeResponse,
  HistMove,
  MoveClass,
  MoveEntry,
  ReviewResponse,
  Side,
} from "../../types/chess";
import { ARROW_COLORS, type GameResult, type PreviewVisibility } from "../../hooks/useChessGame";
import { MOVE_CLASS_META, MOVE_CLASS_ORDER } from "../../lib/moveClass";
import { MoveIcon } from "../MoveIcon/MoveIcon";
import { Tooltip } from "../Tooltip/Tooltip";
import { HELP } from "../Tooltip/help";

const END_LABEL: Record<Exclude<GameResult, null>, string> = {
  checkmate: "Checkmate — game over",
  stalemate: "Stalemate — game over",
  draw: "Draw — game over",
};

interface Props {
  history: HistMove[];
  pointer: number;
  onJump: (ply: number) => void;
  analysis: AnalyzeResponse | null;
  guidedNext: MoveEntry | null;
  trainingName: string | null;
  active: boolean;
  previewVisibility: PreviewVisibility;
  canUndo: boolean;
  canRedo: boolean;
  nextIsAutoPlay: boolean;
  endgame: { ply: number; result: GameResult } | null;
  playing: boolean;
  onTogglePlay: () => void;
  onUndo: () => void;
  onRedo: () => void;
  review: ReviewResponse | null;
  analyzing: boolean;
  canAnalyze: boolean;
  onAnalyze: () => void;
  reviewSide: Side;
  onReviewSide: (s: Side) => void;
}

export function MoveList({
  history,
  pointer,
  onJump,
  analysis,
  guidedNext,
  trainingName,
  active,
  previewVisibility,
  canUndo,
  canRedo,
  nextIsAutoPlay,
  endgame,
  playing,
  onTogglePlay,
  onUndo,
  onRedo,
  review,
  analyzing,
  canAnalyze,
  onAnalyze,
  reviewSide,
  onReviewSide,
}: Props) {
  // Keep the current move in view (e.g. while replaying a PGN).
  const currentRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [pointer]);

  const pairs: Array<{ moveNum: number; white?: HistMove; black?: HistMove }> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ moveNum: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  const cell = (move: HistMove | undefined, index: number) => {
    if (!move) return <span className="w-20" />;
    const isCurrent = index + 1 === pointer;
    const cls = review?.moves[index]?.classification;
    const meta = cls && cls !== "unknown" ? MOVE_CLASS_META[cls] : null;
    return (
      <button
        onClick={() => onJump(index + 1)}
        className={`w-20 font-mono rounded px-1 flex items-center gap-1 ${
          isCurrent ? "bg-purple-600/40" : "hover:bg-slate-700/40"
        }`}
      >
        {cls && meta && <MoveIcon cls={cls} size={13} />}
        <span className="font-bold truncate" style={meta ? { color: meta.color } : undefined}>
          {move.san}
        </span>
      </button>
    );
  };

  // Only your own moves count: white = odd plies, black = even plies.
  const isMine = (ply: number) => (ply % 2 === 1) === (reviewSide === "white");

  // Jump to the next move of a given quality (yours only), wrapping around.
  const cycleClass = (cls: MoveClass) => {
    if (!review) return;
    const plies = review.moves
      .filter((m) => m.classification === cls && isMine(m.ply))
      .map((m) => m.ply)
      .sort((a, b) => a - b);
    if (plies.length === 0) return;
    onJump(plies.find((p) => p > pointer) ?? plies[0]);
  };

  const openingName = trainingName ?? analysis?.name ?? null;

  const HINTS = [
    { key: "recommended", label: "Recommended", san: analysis?.recommended.san ?? null },
    { key: "guided", label: "Guided", san: guidedNext?.san ?? null },
    { key: "sparring", label: "Sparring", san: analysis?.previews.sparring.san ?? null },
    { key: "challenge", label: "Challenge", san: analysis?.previews.challenge.san ?? null },
  ] as const;
  const visibleHints = HINTS.filter((h) => previewVisibility[h.key]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {active && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1 h-4">
            <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
              Opening
            </span>
            {analysis && !analysis.in_book && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">
                Off book
              </span>
            )}
          </div>
          <div className="h-5 flex items-center">
            {openingName ? (
              <span className="text-white font-semibold text-sm truncate">{openingName}</span>
            ) : analysis ? (
              <span className="text-slate-500 text-sm">Unnamed line</span>
            ) : (
              <Band className="w-2/3 h-3.5" />
            )}
          </div>
          <div className="text-slate-400 text-xs mt-1 h-4 truncate">
            {trainingName && analysis?.name && analysis.name !== trainingName ? (
              <>
                Current:{" "}
                {analysis.eco && (
                  <Tooltip {...HELP.eco}>
                    <span className="font-mono font-semibold text-slate-300 cursor-help border-b border-dotted border-slate-600">
                      {analysis.eco}
                    </span>
                  </Tooltip>
                )}{" "}
                {analysis.name}
              </>
            ) : null}
          </div>
        </div>
      )}

      {active && visibleHints.length > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Next move
          </div>
          {visibleHints.map((h) => (
            <HintRow
              key={h.key}
              label={h.label}
              san={h.san}
              color={ARROW_COLORS[h.key]}
              loading={!analysis}
            />
          ))}
        </div>
      )}

      <div className="bg-slate-800/60 rounded-lg border border-slate-700/50 flex-1 flex flex-col min-h-0">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider p-3 pb-2">
          Move History
        </div>
        <div className="flex-1 overflow-y-auto px-1 min-h-0">
          {pairs.length === 0 ? (
            <div className="text-slate-600 text-xs text-center py-4">Make your first move</div>
          ) : (
            <div className="text-sm">
              {pairs.map(({ moveNum, white, black }, rowIdx) => (
                <Fragment key={moveNum}>
                  <div
                    ref={
                      pointer > 0 && Math.ceil(pointer / 2) === moveNum ? currentRowRef : undefined
                    }
                    className={`flex items-center gap-2 px-2 py-0.5 rounded ${
                      rowIdx % 2 === 1 ? "bg-slate-700/25" : ""
                    }`}
                  >
                    <span className="text-slate-500 w-6 text-right shrink-0 text-xs">
                      {moveNum}.
                    </span>
                    {cell(white, (moveNum - 1) * 2)}
                    {cell(black, (moveNum - 1) * 2 + 1)}
                  </div>
                  {endgame && endgame.result && Math.ceil(endgame.ply / 2) === moveNum && (
                    <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                      <span className="flex-1 h-px bg-amber-500/30" />
                      {END_LABEL[endgame.result]}
                      <span className="flex-1 h-px bg-amber-500/30" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
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
              onClick={onTogglePlay}
              aria-label={playing ? "Pause" : "Play through moves"}
              className={`w-1/3 py-2 text-center border-l border-slate-700/50 font-semibold ${
                playing
                  ? "bg-emerald-600/90 text-white hover:bg-emerald-600"
                  : "text-emerald-400 hover:bg-emerald-500/15"
              }`}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo && !nextIsAutoPlay}
              aria-label={nextIsAutoPlay ? "Play your next move" : "Forward"}
              title={nextIsAutoPlay ? "Plays your next move (not history)" : undefined}
              className={`w-1/3 py-2 text-center border-l border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed ${
                nextIsAutoPlay
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
        <ReviewSummary
          review={review}
          onCycle={cycleClass}
          reviewSide={reviewSide}
          onReviewSide={onReviewSide}
        />
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

function ReviewSummary({
  review,
  onCycle,
  reviewSide,
  onReviewSide,
}: {
  review: ReviewResponse;
  onCycle: (cls: MoveClass) => void;
  reviewSide: Side;
  onReviewSide: (s: Side) => void;
}) {
  if (!review.engine_available) {
    return (
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-xs text-slate-400">
        Stockfish is unavailable, so this game couldn't be analysed.
      </div>
    );
  }
  const mine = (ply: number) => (ply % 2 === 1) === (reviewSide === "white");
  const counts = MOVE_CLASS_ORDER.map((c) => ({
    cls: c,
    n: review.moves.filter((m) => m.classification === c && mine(m.ply)).length,
  })).filter((x) => x.n > 0);
  const accuracy = reviewSide === "white" ? review.white_accuracy : review.black_accuracy;

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          You played
        </div>
        <div className="inline-flex rounded-md border border-slate-700/60 overflow-hidden text-[11px]">
          {(["white", "black"] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => onReviewSide(s)}
              className={`px-2 py-0.5 capitalize ${
                reviewSide === s ? "bg-purple-600/40 text-white" : "text-slate-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs text-slate-300">
        Accuracy <span className="font-semibold text-white">{accuracy ?? "—"}%</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {counts.length === 0 ? (
          <span className="text-[11px] text-slate-500">No moves for this side.</span>
        ) : (
          counts.map(({ cls, n }) => (
            <button
              key={cls}
              onClick={() => onCycle(cls)}
              title={`${MOVE_CLASS_META[cls].label} — click to cycle`}
              className="flex items-center gap-1 text-xs rounded px-1.5 py-0.5 hover:bg-slate-700/60"
            >
              <MoveIcon cls={cls} size={14} />
              <span className="font-semibold text-slate-200">{n}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Band({ className = "" }: { className?: string }) {
  return <span className={`inline-block rounded bg-slate-700 animate-pulse ${className}`} />;
}

function HintRow({
  label,
  san,
  color,
  loading,
}: {
  label: string;
  san: string | null;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 h-4">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-slate-300 text-xs flex items-center gap-1">
        {label}:{" "}
        {loading ? (
          <Band className="w-9 h-3" />
        ) : (
          <span className="text-white font-mono font-semibold">{san ?? "—"}</span>
        )}
      </span>
    </div>
  );
}
