import { useState } from "react";
import type { OpeningListItem } from "../../types/chess";

const RECENT_COLLAPSED = 5;

interface Props {
  openings: OpeningListItem[];
  recent: OpeningListItem[];
  favorites: OpeningListItem[];
  loading: boolean;
  selectedId: string | null;
  search: string;
  onSearchChange: (s: string) => void;
  onSelect: (item: OpeningListItem) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (item: OpeningListItem) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
      {children}
    </div>
  );
}

function OpeningRow({
  item,
  selected,
  favorite,
  onSelect,
  onToggleFavorite,
}: {
  item: OpeningListItem;
  selected: boolean;
  favorite: boolean;
  onSelect: (item: OpeningListItem) => void;
  onToggleFavorite: (item: OpeningListItem) => void;
}) {
  const isWhite = item.move_count % 2 === 1;
  return (
    <div
      className={`group flex items-stretch rounded-lg mb-1 border ${
        selected ? "bg-purple-600/30 border-purple-500/50" : "border-transparent hover:bg-slate-700/50"
      }`}
    >
      <button onClick={() => onSelect(item)} className="flex-1 text-left px-3 py-2 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-mono font-bold ${
              selected ? "text-purple-300" : "text-slate-500"
            }`}
          >
            {item.eco}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <span
              className={`px-1 rounded font-semibold ${
                isWhite ? "bg-slate-200/90 text-slate-900" : "bg-slate-700 text-slate-100"
              }`}
            >
              {isWhite ? "W" : "B"}
            </span>
            {item.move_count} moves
          </span>
        </div>
        <div
          className={`text-sm font-medium mt-0.5 truncate ${
            selected ? "text-white" : "text-slate-200"
          }`}
        >
          {item.name}
        </div>
      </button>
      <button
        onClick={() => onToggleFavorite(item)}
        aria-label={favorite ? "Unfavorite" : "Favorite"}
        className={`px-2 text-lg leading-none ${
          favorite ? "text-yellow-400" : "text-slate-600 hover:text-slate-300"
        }`}
      >
        {favorite ? "★" : "☆"}
      </button>
    </div>
  );
}

export function OpeningSelector({
  openings,
  recent,
  favorites,
  loading,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const [recentExpanded, setRecentExpanded] = useState(false);
  const recentShown = recentExpanded ? recent : recent.slice(0, RECENT_COLLAPSED);

  const row = (item: OpeningListItem) => (
    <OpeningRow
      key={item.id}
      item={item}
      selected={selectedId === item.id}
      favorite={isFavorite(item.id)}
      onSelect={onSelect}
      onToggleFavorite={onToggleFavorite}
    />
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {favorites.length > 0 && (
        <div className="px-2 py-2 border-b border-slate-700/60 bg-slate-900/40">
          <SectionLabel>★ Favorites</SectionLabel>
          <div className="max-h-36 overflow-y-auto">{favorites.map(row)}</div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="px-2 py-2 border-b border-slate-700/60 bg-slate-900/40">
          <SectionLabel>Recently played</SectionLabel>
          <div className="max-h-48 overflow-y-auto">{recentShown.map(row)}</div>
          {recent.length > RECENT_COLLAPSED && (
            <button
              onClick={() => setRecentExpanded((x) => !x)}
              className="w-full text-center text-xs text-purple-300 hover:text-purple-200 py-1"
            >
              {recentExpanded ? "Show less" : `Show ${recent.length - RECENT_COLLAPSED} more`}
            </button>
          )}
        </div>
      )}

      <div className="px-3 py-2">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search openings…"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
        />
      </div>

      <div className="overflow-y-auto flex-1 px-2 pb-2">
        {loading ? (
          <div className="text-center text-slate-500 text-sm py-8">Loading…</div>
        ) : openings.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">No openings match</div>
        ) : (
          openings.map(row)
        )}
      </div>
    </div>
  );
}
