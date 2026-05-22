import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { Opening, OpeningListItem } from "../types/chess";

export function useOpenings() {
  const [openings, setOpenings] = useState<OpeningListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.openings.list();
      setOpenings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load openings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOpenings();
  }, [fetchOpenings]);

  return { openings, loading, error, refetch: fetchOpenings };
}

export function useOpening(id: string | null) {
  const [opening, setOpening] = useState<Opening | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setOpening(null);
      return;
    }
    setLoading(true);
    api.openings
      .get(id)
      .then(setOpening)
      .catch(() => setOpening(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { opening, loading };
}
