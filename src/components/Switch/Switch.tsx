interface Props {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

export function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-1.5"
    >
      {label && <span className="text-[11px] text-slate-400">{label}</span>}
      <span
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? "bg-purple-600" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}
