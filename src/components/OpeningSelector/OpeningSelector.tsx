import type { OpeningListItem } from "../../types/chess";

interface Props {
  openings: OpeningListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
}

export function OpeningSelector({
  openings,
  loading,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 pb-2">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search openings…"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
        />
      </div>

      <div className="overflow-y-auto flex-1 px-2 py-1">
        {loading ? (
          <div className="text-center text-slate-500 text-sm py-8">Loading…</div>
        ) : openings.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">No openings match</div>
        ) : (
          openings.map((o) => (
            <button
              key={o.id}
              onClick={() => onSelect(o.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                selectedId === o.id
                  ? "bg-purple-600/30 border border-purple-500/50"
                  : "hover:bg-slate-700/50 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold ${
                    selectedId === o.id ? "text-purple-300" : "text-slate-500"
                  }`}
                >
                  {o.eco}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-600">
                  <span
                    className={`px-1 rounded font-semibold ${
                      o.move_count % 2 === 1
                        ? "bg-slate-200/90 text-slate-900"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {o.move_count % 2 === 1 ? "W" : "B"}
                  </span>
                  {o.move_count} moves
                </span>
              </div>
              <div
                className={`text-sm font-medium mt-0.5 ${
                  selectedId === o.id ? "text-white" : "text-slate-200"
                }`}
              >
                {o.name}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
