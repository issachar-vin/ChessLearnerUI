import type { Mode } from "../../types/chess";
import { Tooltip } from "../Tooltip/Tooltip";
import { HELP } from "../Tooltip/help";

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  strict: boolean;
  onStrictChange: (b: boolean) => void;
  onReset: () => void;
}

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "guided", label: "Guided", hint: "Opponent follows the opening line" },
  { key: "sparring", label: "Sparring", hint: "Opponent plays the most common move" },
  { key: "challenge", label: "Challenge", hint: "Opponent plays the engine's best move" },
];

export function Controls({ mode, onModeChange, strict, onStrictChange, onReset }: Props) {
  const activeHint = MODES.find((m) => m.key === mode)?.hint;

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

      {activeHint && <span className="text-xs text-slate-500">{activeHint}</span>}
    </div>
  );
}
