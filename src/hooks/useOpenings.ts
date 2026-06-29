import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Opening, OpeningListItem } from "../types/chess";

export function useOpenings(search: string) {
  const [openings, setOpenings] = useState<OpeningListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const handle = setTimeout(() => {
      api.openings
        .list(search.trim() || undefined, 100)
        .then((data) => active && setOpenings(data))
        .catch(() => active && setOpenings([]))
        .finally(() => active && setLoading(false));
    }, 200);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [search]);

  return { openings, loading };
}

export function useOpening(id: string | null) {
  const [opening, setOpening] = useState<Opening | null>(null);

  useEffect(() => {
    if (!id) {
      setOpening(null);
      return;
    }
    let active = true;
    api.openings
      .get(id)
      .then((data) => active && setOpening(data))
      .catch(() => active && setOpening(null));
    return () => {
      active = false;
    };
  }, [id]);

  return { opening };
}
