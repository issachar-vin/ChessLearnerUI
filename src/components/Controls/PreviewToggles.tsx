import { ARROW_COLORS, type PreviewVisibility } from "../../hooks/useChessGame";
import { Tooltip } from "../Tooltip/Tooltip";
import { HELP } from "../Tooltip/help";

interface Props {
  previewVisibility: PreviewVisibility;
  onPreviewChange: (v: PreviewVisibility) => void;
}

const PREVIEW_KEYS: { key: keyof PreviewVisibility; label: string; color: string }[] = [
  { key: "recommended", label: "Recommended", color: ARROW_COLORS.recommended },
  { key: "guided", label: "Guided", color: ARROW_COLORS.guided },
  { key: "sparring", label: "Sparring", color: ARROW_COLORS.sparring },
  { key: "challenge", label: "Challenge", color: ARROW_COLORS.challenge },
];

export function PreviewToggles({ previewVisibility, onPreviewChange }: Props) {
  const toggle = (key: keyof PreviewVisibility) =>
    onPreviewChange({ ...previewVisibility, [key]: !previewVisibility[key] });

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <Tooltip {...HELP.previews}>
        <span className="text-xs text-slate-500 uppercase tracking-wider cursor-help border-b border-dotted border-slate-600">
          Previews
        </span>
      </Tooltip>
      {PREVIEW_KEYS.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            previewVisibility[key]
              ? "border-slate-500 bg-slate-700/50 text-white"
              : "border-slate-700/60 text-slate-500 hover:bg-slate-700/30"
          }`}
        >
          <span className="inline-block w-3.5 border-t-2" style={{ borderColor: color }} />
          {label}
        </button>
      ))}
    </div>
  );
}
