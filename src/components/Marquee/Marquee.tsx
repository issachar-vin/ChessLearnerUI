import { useRef, useState, type CSSProperties } from "react";

interface Props {
  text: string;
  className?: string;
}

// Shows text truncated with an ellipsis; on hover, if it actually overflows, it
// scrolls the full string into view and ping-pongs back, looping until unhovered.
export function Marquee({ text, className = "" }: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  const [animate, setAnimate] = useState(false);

  const start = () => {
    const el = wrapRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow > 1) {
      setShift(-overflow);
      setAnimate(true);
    }
  };

  const stop = () => setAnimate(false);

  const style: CSSProperties | undefined = animate
    ? ({
        "--marquee-shift": `${shift}px`,
        animationDuration: `${Math.max(1.2, Math.abs(shift) / 50)}s`,
      } as CSSProperties)
    : undefined;

  return (
    <span
      ref={wrapRef}
      onMouseEnter={start}
      onMouseLeave={stop}
      className={`block overflow-hidden whitespace-nowrap ${animate ? "" : "text-ellipsis"} ${className}`}
    >
      <span className={animate ? "inline-block animate-marquee" : ""} style={style}>
        {text}
      </span>
    </span>
  );
}
