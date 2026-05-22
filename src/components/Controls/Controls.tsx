interface Props {
  counteringEnabled: boolean;
  onToggleCountering: (val: boolean) => void;
  onReset: () => void;
  isPlaying: boolean;
}

export function Controls({ counteringEnabled, onToggleCountering, onReset, isPlaying }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Counter mode toggle */}
      <button
        onClick={() => onToggleCountering(!counteringEnabled)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
          counteringEnabled
            ? "bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30"
            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${counteringEnabled ? "bg-red-400" : "bg-emerald-400"}`} />
        {counteringEnabled ? "Counter Mode: ON" : "Practice Mode: ON"}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        disabled={!isPlaying}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Reset
      </button>

      {/* Mode description */}
      <span className="text-xs text-slate-500 ml-1">
        {counteringEnabled
          ? "Opponent will try to beat you"
          : "Opponent plays into the opening"}
      </span>
    </div>
  );
}
