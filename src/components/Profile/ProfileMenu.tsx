import { useEffect, useRef, useState } from "react";
import type { PieceType, Profile } from "../../types/chess";
import { PIECE_LABELS, SELECTABLE_PIECES } from "../../lib/pieces";
import { PieceIcon } from "../PieceIcon/PieceIcon";
import { Avatar } from "./Avatar";

interface Props {
  profile: Profile;
  onSave: (profile: Profile) => void;
}

const MAX_DIM = 128;

// Downscale an uploaded image to a small square data URL so it fits in
// localStorage and renders crisply at avatar sizes.
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfileMenu({ profile, onSave }: Props) {
  const [open, setOpen] = useState(false);
  // Edits stay local to the panel until the user clicks Save.
  const [draft, setDraft] = useState<Profile>(profile);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const setPiece = (piece: PieceType) =>
    setDraft((d) => ({ ...d, icon: { type: "piece", piece } }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const src = await resizeToDataUrl(file);
      setDraft((d) => ({ ...d, icon: { type: "image", src } }));
    } catch {
      /* unreadable image — ignore */
    }
    e.target.value = "";
  };

  const handleSave = () => {
    onSave(draft);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full pl-3 pr-0.5 py-0.5 ring-2 ring-transparent hover:ring-purple-500/60 transition"
        title="Profile"
      >
        <span className="text-sm font-medium text-slate-200 max-w-[10rem] truncate">
          {profile.name}
        </span>
        <Avatar icon={profile.icon} size={40} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-72 z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-4 space-y-4 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <Avatar icon={draft.icon} size={48} />
            <div className="text-sm text-slate-400">Your profile</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Name
            </label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Player"
              maxLength={24}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Piece icon
            </div>
            <div className="flex gap-1.5">
              {SELECTABLE_PIECES.map((p) => {
                const active = draft.icon.type === "piece" && draft.icon.piece === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPiece(p)}
                    title={PIECE_LABELS[p]}
                    className={`flex-1 aspect-square rounded-md flex items-center justify-center border ${
                      active
                        ? "bg-purple-600/40 border-purple-500"
                        : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    <PieceIcon type={p} color="w" size={28} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Or upload an image
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className={`w-full rounded-md px-3 py-2 text-sm border ${
                draft.icon.type === "image"
                  ? "bg-purple-600/40 border-purple-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {draft.icon.type === "image" ? "Change image" : "Choose image…"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-md bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-2 transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
