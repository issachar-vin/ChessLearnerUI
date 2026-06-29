import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  title: string;
  body: ReactNode;
  children: ReactNode;
  className?: string;
}

const CARD_WIDTH = 288;

// A hover/focus info card rendered through a portal so it is never clipped by a
// scroll/overflow container. Positioned below the trigger and clamped to the
// viewport so edge controls stay readable.
export function Tooltip({ title, body, children, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const half = CARD_WIDTH / 2;
    const left = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8);
    setPos({ top: r.bottom + 8, left });
  };

  return (
    <span
      ref={ref}
      className={`inline-flex ${className}`}
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      onFocus={show}
      onBlur={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: CARD_WIDTH,
              transform: "translateX(-50%)",
            }}
            className="z-[100] rounded-lg border border-slate-700 bg-slate-900 shadow-2xl p-3 animate-fade-in pointer-events-none"
          >
            <div className="text-xs font-semibold text-white mb-1">{title}</div>
            <div className="text-[11px] leading-relaxed text-slate-400 space-y-1">{body}</div>
          </div>,
          document.body
        )}
    </span>
  );
}
