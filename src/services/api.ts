import type {
  AIMoveResponse,
  AnalyzeResponse,
  Mode,
  Opening,
  OpeningListItem,
  ReviewResponse,
} from "../types/chess";

const BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  openings: {
    list: (search?: string, limit = 100) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (search) params.set("search", search);
      return request<OpeningListItem[]>(`/openings?${params.toString()}`);
    },
    get: (id: string) => request<Opening>(`/openings/${id}`),
  },

  game: {
    analyze: (params: { fen: string; moves_played: string[]; opening_id: string | null }) =>
      request<AnalyzeResponse>("/game/analyze", {
        method: "POST",
        body: JSON.stringify(params),
      }),

    aiMove: (params: {
      fen: string;
      moves_played: string[];
      mode: Mode;
      opening_id: string | null;
      ai_opening_id: string | null;
    }) =>
      request<AIMoveResponse>("/game/ai-move", {
        method: "POST",
        body: JSON.stringify(params),
      }),

    review: (params: { moves: string[]; think_ms?: number }) =>
      request<ReviewResponse>("/game/review", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  },
};
