import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

interface Props {
  onImported: () => void;
}

const EXAMPLE_PGN = `[ECO "C55"]
[White "Italian Game: Two Knights"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6`;

export function ImportOpening({ onImported }: Props) {
  const [pgn, setPgn] = useState("");
  const [eco, setEco] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [userPlays, setUserPlays] = useState<"white" | "black">("white");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgn.trim()) {
      toast.error("PGN is required");
      return;
    }
    setLoading(true);
    try {
      await api.openings.import({
        pgn: pgn.trim(),
        eco: eco.trim() || undefined,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        user_plays: userPlays,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Opening imported!");
      setPgn("");
      setEco("");
      setName("");
      setDescription("");
      setTags("");
      setOpen(false);
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-slate-600 text-slate-400 hover:border-purple-500/50 hover:text-purple-300 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Import Opening (PGN)
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-slate-700/50 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">Import Opening</span>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
        <div>
          <label className="text-xs text-slate-400 block mb-1">PGN *</label>
          <textarea
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            placeholder={EXAMPLE_PGN}
            rows={5}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1">ECO Code</label>
            <input
              value={eco}
              onChange={(e) => setEco(e.target.value)}
              placeholder="C50"
              className="w-full bg-slate-900/80 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Play as</label>
            <select
              value={userPlays}
              onChange={(e) => setUserPlays(e.target.value as "white" | "black")}
              className="w-full bg-slate-900/80 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Italian Game: Two Knights"
            className="w-full bg-slate-900/80 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tags (comma separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="beginner, e4, tactical"
            className="w-full bg-slate-900/80 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </form>
    </div>
  );
}
