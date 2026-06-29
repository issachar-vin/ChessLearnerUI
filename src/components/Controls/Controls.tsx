import { ARROW_COLORS, type PreviewVisibility } from "../../hooks/useChessGame";
import type { Mode } from "../../types/chess";
import { Tooltip } from "../Tooltip/Tooltip";
import { HELP } from "../Tooltip/help";

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  strict: boolean;
  onStrictChange: (b: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  nextIsAutoPlay: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  previewVisibility: PreviewVisibility;
  onPreviewChange: (v: PreviewVisibility) => void;
}

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "guided", label: "Guided", hint: "Opponent follows the opening line" },
  { key: "sparring", label: "Sparring", hint: "Opponent plays the most common move" },
  { key: "challenge", label: "Challenge", hint: "Opponent plays the engine's best move" },
];

const PREVIEW_KEYS: { key: keyof PreviewVisibility; label: string; color: string }[] = [
  { key: "recommended", label: "Recommended", color: ARROW_COLORS.recommended },
  { key: "guided", label: "Guided", color: ARROW_COLORS.guided },
  { key: "sparring", label: "Sparring", color: ARROW_COLORS.sparring },
  { key: "challenge", label: "Challenge", color: ARROW_COLORS.challenge },
];

export function Controls({
  mode,
  onModeChange,
  strict,
  onStrictChange,
  canUndo,
  canRedo,
  nextIsAutoPlay,
  onUndo,
  onRedo,
  onReset,
  previewVisibility,
  onPreviewChange,
}: Props) {
  const activeHint = MODES.find((m) => m.key === mode)?.hint;
  const togglePreview = (key: keyof PreviewVisibility) =>
    onPreviewChange({ ...previewVisibility, [key]: !previewVisibility[key] });

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Mode segmented control */}
        <Tooltip {...HELP.mode}>
          <div className="inline-flex rounded-lg border border-slate-700/60 overflow-hidden">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => onModeChange(m.key)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  mode === m.key
                    ? "bg-purple-600/40 text-white"
                    : "text-slate-400 hover:bg-slate-700/40"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </Tooltip>

        {/* Guided strict toggle */}
        {mode === "guided" && (
          <Tooltip {...HELP.strict}>
            <button
              onClick={() => onStrictChange(!strict)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                strict
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                  : "border-slate-600/50 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${strict ? "bg-blue-400" : "bg-slate-500"}`} />
              Strict
            </button>
          </Tooltip>
        )}

        {/* Undo / redo */}
        <Tooltip {...HELP.nav}>
          <div className="inline-flex rounded-lg border border-slate-700/60 overflow-hidden">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo move"
              className="px-3 py-2 text-slate-300 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ◀
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo && !nextIsAutoPlay}
              aria-label={nextIsAutoPlay ? "Play autoplay move" : "Redo move"}
              title={nextIsAutoPlay ? "Plays the autoplay move (not history)" : undefined}
              className={`px-3 py-2 border-l border-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed ${
                nextIsAutoPlay && !canRedo
                  ? "text-emerald-400 hover:bg-emerald-500/15"
                  : "text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              ▶
            </button>
          </div>
        </Tooltip>

        {/* Reset */}
        <Tooltip {...HELP.reset}>
          <button
            onClick={onReset}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
          >
            Reset
          </button>
        </Tooltip>
      </div>

      {/* Preview toggles */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Tooltip {...HELP.previews}>
          <span className="text-xs text-slate-500 uppercase tracking-wider cursor-help border-b border-dotted border-slate-600">
            Previews
          </span>
        </Tooltip>
        {PREVIEW_KEYS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => togglePreview(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              previewVisibility[key]
                ? "border-slate-500 bg-slate-700/50 text-white"
                : "border-slate-700/60 text-slate-500 hover:bg-slate-700/30"
            }`}
          >
            <span className="inline-block w-3.5 border-t-2" style={{ borderColor: color }} />
            {label}
          </button>
        ))}
      </div>

      {activeHint && <span className="text-xs text-slate-500">{activeHint}</span>}
    </div>
  );
}
