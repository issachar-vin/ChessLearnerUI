import type { OpeningListItem } from "../../types/chess";

interface Props {
  openings: OpeningListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-300",
  intermediate: "bg-yellow-500/20 text-yellow-300",
  advanced: "bg-red-500/20 text-red-300",
  e4: "bg-blue-500/20 text-blue-300",
  d4: "bg-indigo-500/20 text-indigo-300",
  classical: "bg-slate-500/20 text-slate-300",
  solid: "bg-stone-500/20 text-stone-300",
  dynamic: "bg-orange-500/20 text-orange-300",
  system: "bg-cyan-500/20 text-cyan-300",
};

function Tag({ tag }: { tag: string }) {
  const cls = TAG_COLORS[tag] ?? "bg-slate-600/30 text-slate-400";
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>
      {tag}
    </span>
  );
}

export function OpeningSelector({ openings, loading, selectedId, onSelect }: Props) {
  const white = openings.filter((o) => o.user_plays === "white");
  const black = openings.filter((o) => o.user_plays === "black");

  const renderGroup = (label: string, items: OpeningListItem[]) => (
    <div className="mb-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-1">
        {label}
      </div>
      {items.map((o) => (
        <button
          key={o.id}
          onClick={() => onSelect(o.id)}
          className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 group ${
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
            <span className="text-[10px] text-slate-600">{o.move_count} moves</span>
          </div>
          <div
            className={`text-sm font-medium mt-0.5 ${
              selectedId === o.id ? "text-white" : "text-slate-200"
            }`}
          >
            {o.name}
          </div>
          {o.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {o.tags.slice(0, 3).map((t) => (
                <Tag key={t} tag={t} />
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-500 text-sm">
        Loading openings...
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1 px-2 py-2">
      {white.length > 0 && renderGroup("Play as White ♙", white)}
      {black.length > 0 && renderGroup("Play as Black ♟", black)}
      {openings.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-8">
          No openings yet. Import one below.
        </div>
      )}
    </div>
  );
}
