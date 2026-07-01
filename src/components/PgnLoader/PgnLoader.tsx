import { Chess } from "chess.js";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface Props {
  onLoad: (moves: string[]) => void;
  label?: string;
  className?: string;
}

function parsePgn(pgn: string): string[] | null {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    return null;
  }
  const moves = chess.history({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion ?? ""}`);
  return moves.length ? moves : null;
}

export function PgnLoader({ onLoad, label = "Load PGN", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (pgn: string) => {
    const moves = parsePgn(pgn);
    if (!moves) {
      toast.error("Couldn't read that PGN");
      return;
    }
    onLoad(moves);
    setOpen(false);
    setText("");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) submit(await file.text());
    e.target.value = "";
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Load a PGN</h3>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste PGN here…"
                rows={8}
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md px-3 py-2 text-sm border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Choose file…
                </button>
                <button
                  onClick={() => submit(text)}
                  disabled={!text.trim()}
                  className="rounded-md px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white"
                >
                  Load &amp; replay
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pgn,text/plain"
                onChange={onFile}
                className="hidden"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
