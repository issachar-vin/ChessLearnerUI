import type {
  AIMoveResponse,
  AnalyzeResponse,
  ImportOpeningRequest,
  Opening,
  OpeningListItem,
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
    list: () => request<OpeningListItem[]>("/openings"),
    get: (id: string) => request<Opening>(`/openings/${id}`),
    import: (data: ImportOpeningRequest) =>
      request<{ id: string; message: string }>("/openings/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetch(`${BASE_URL}/api/openings/${id}`, { method: "DELETE" }),
  },

  game: {
    analyze: (params: {
      opening_id: string;
      fen: string;
      moves_played: string[];
      countering_enabled: boolean;
    }) =>
      request<AnalyzeResponse>("/game/analyze", {
        method: "POST",
        body: JSON.stringify(params),
      }),

    aiMove: (params: {
      opening_id: string;
      fen: string;
      moves_played: string[];
      countering_enabled: boolean;
    }) =>
      request<AIMoveResponse>("/game/ai-move", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  },
};
