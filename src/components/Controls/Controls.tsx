import { useState } from "react";
import { ARROW_COLORS, type PreviewVisibility } from "../../hooks/useChessGame";
import type { Mode } from "../../types/chess";

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  strict: boolean;
  onStrictChange: (b: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
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
  onUndo,
  onRedo,
  onReset,
  previewVisibility,
  onPreviewChange,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const activeHint = MODES.find((m) => m.key === mode)?.hint;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Mode segmented control */}
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

        {/* Guided strict toggle */}
        {mode === "guided" && (
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
        )}

        {/* Undo / redo */}
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
            disabled={!canRedo}
            aria-label="Redo move"
            className="px-3 py-2 text-slate-300 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-700/60"
          >
            ▶
          </button>
        </div>

        {/* Preview dropdown */}
        <div className="relative">
          <button
            onClick={() => setPreviewOpen((o) => !o)}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
          >
            Previews ▾
          </button>
          {previewOpen && (
            <div className="absolute z-20 mt-1 right-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2">
              {PREVIEW_KEYS.map(({ key, label, color }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700/50 cursor-pointer text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={previewVisibility[key]}
                    onChange={(e) =>
                      onPreviewChange({ ...previewVisibility, [key]: e.target.checked })
                    }
                  />
                  <span className="inline-block w-3 h-0 border-t-2" style={{ borderColor: color }} />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
        >
          Reset
        </button>
      </div>

      {activeHint && <span className="text-xs text-slate-500">{activeHint}</span>}
    </div>
  );
}
