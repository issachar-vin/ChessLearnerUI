import { useCallback, useState } from "react";
import type { OpeningListItem } from "../types/chess";

function load(key: string): OpeningListItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as OpeningListItem[]) : [];
  } catch {
    return [];
  }
}

function save(key: string, items: OpeningListItem[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* storage unavailable — ignore */
  }
}

// `namespace` keeps the learner's and the AI's recent/favorite lists separate.
export function useOpeningLibrary(namespace: "user" | "ai") {
  const RECENT_KEY = `chesslearner.recent.${namespace}`;
  const FAVORITES_KEY = `chesslearner.favorites.${namespace}`;
  const [recent, setRecent] = useState<OpeningListItem[]>(() => load(RECENT_KEY));
  const [favorites, setFavorites] = useState<OpeningListItem[]>(() => load(FAVORITES_KEY));

  // Unbounded, unique, most-recent-first.
  const addRecent = useCallback(
    (item: OpeningListItem) => {
      setRecent((prev) => {
        const next = [item, ...prev.filter((o) => o.id !== item.id)];
        save(RECENT_KEY, next);
        return next;
      });
    },
    [RECENT_KEY]
  );

  const toggleFavorite = useCallback(
    (item: OpeningListItem) => {
      setFavorites((prev) => {
        const exists = prev.some((o) => o.id === item.id);
        const next = exists ? prev.filter((o) => o.id !== item.id) : [item, ...prev];
        save(FAVORITES_KEY, next);
        return next;
      });
    },
    [FAVORITES_KEY]
  );

  const isFavorite = useCallback((id: string) => favorites.some((o) => o.id === id), [favorites]);

  return { recent, favorites, addRecent, toggleFavorite, isFavorite };
}
