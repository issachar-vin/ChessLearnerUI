import { useState, type ReactNode } from "react";
import type { OpeningListItem } from "../../types/chess";
import { Marquee } from "../Marquee/Marquee";

type Tab = "search" | "recent" | "favorites";

interface Props {
  title: string;
  subtitle?: string;
  accentText: string; // literal tailwind text-color class for the active row's eco
  accentDot: string; // literal tailwind bg-color class for the title dot
  headerRight?: ReactNode;
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

function OpeningRow({
  item,
  selected,
  favorite,
  accentText,
  onSelect,
  onToggleFavorite,
}: {
  item: OpeningListItem;
  selected: boolean;
  favorite: boolean;
  accentText: string;
  onSelect: (item: OpeningListItem) => void;
  onToggleFavorite: (item: OpeningListItem) => void;
}) {
  const isWhite = item.move_count % 2 === 1;
  return (
    <div
      className={`group flex items-stretch rounded-lg mb-1 border ${
        selected
          ? "bg-slate-700/60 border-slate-500/60"
          : "border-transparent hover:bg-slate-700/40"
      }`}
    >
      <button onClick={() => onSelect(item)} className="flex-1 text-left px-3 py-2 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-mono font-bold ${selected ? accentText : "text-slate-500"}`}
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
        <Marquee
          text={item.name}
          className={`text-sm font-medium mt-0.5 ${selected ? "text-white" : "text-slate-200"}`}
        />
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

const TABS: { key: Tab; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "recent", label: "Recent" },
  { key: "favorites", label: "Favorites" },
];

export function OpeningPanel({
  title,
  subtitle,
  accentText,
  accentDot,
  headerRight,
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
  const [tab, setTab] = useState<Tab>("search");

  const row = (item: OpeningListItem) => (
    <OpeningRow
      key={item.id}
      item={item}
      selected={selectedId === item.id}
      favorite={isFavorite(item.id)}
      accentText={accentText}
      onSelect={onSelect}
      onToggleFavorite={onToggleFavorite}
    />
  );

  const list = tab === "recent" ? recent : tab === "favorites" ? favorites : openings;
  const empty =
    tab === "recent"
      ? "Nothing played yet"
      : tab === "favorites"
        ? "No favorites yet"
        : loading
          ? "Loading…"
          : "No openings match";

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${accentDot}`} />
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider truncate">
              {title}
            </h2>
          </div>
          {subtitle && <Marquee text={subtitle} className="text-[11px] text-slate-500 mt-0.5" />}
        </div>
        {headerRight}
      </div>

      <div className="px-3">
        <div className="inline-flex w-full rounded-lg bg-slate-800/60 p-0.5 text-xs">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md py-1 font-medium transition-colors ${
                tab === t.key ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "search" && (
        <div className="px-3 pt-2">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search openings…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
        </div>
      )}

      <div className="overflow-y-auto flex-1 px-2 pt-2 pb-2 min-h-0">
        {list.length === 0 ? (
          <div className="text-center text-slate-600 text-xs py-6">{empty}</div>
        ) : (
          list.map(row)
        )}
      </div>
    </div>
  );
}
