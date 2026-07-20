import { useEffect, useRef, useState } from "react";
import { GLOW, SMILE } from "../constants/moods";
import { hexToRgba } from "../lib/color";
import { useAccent } from "../context/AccentContext";
import type { IrisMood } from "../types";

interface IrisProps {
  mood?: IrisMood;
  size?: number;
  intro?: boolean;
  onClick?: () => void;
  className?: string;
  /** Se assente, Iris è puramente decorativa: niente <button>, niente focus a vuoto. */
  ariaLabel?: string;
  /** Colore accento (Pro): sostituisce l'ambra nel glow di lavoro/ricerca/scatto. Free resta sempre #fbbf24. */
  accentHex?: string;
}

export function Iris({ mood = "idle", size = 52, intro = false, onClick, className = "", ariaLabel, accentHex }: IrisProps) {
  const contextAccent = useAccent();
  const resolvedAccent = accentHex ?? contextAccent;
  const box = useRef<HTMLElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [awake, setAwake] = useState(!intro);
  const lastPointer = useRef(0);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      lastPointer.current = Date.now();
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(d, 70) / 70;
      target.current = { x: (dx / d) * 5.5 * m, y: (dy / d) * 4 * m };
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - lastPointer.current > 3500) {
        target.current = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 5 };
      }
    }, 2400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setPupil((p) => ({
        x: p.x + (target.current.x - p.x) * 0.12,
        y: p.y + (target.current.y - p.y) * 0.12,
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
        loop();
      }, 2800 + Math.random() * 3200);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!intro) return;
    const seq = [
      [200, () => setAwake(true)],
      [550, () => (target.current = { x: -6, y: 1 })],
      [950, () => (target.current = { x: 6, y: -1 })],
      [1350, () => (target.current = { x: 0, y: 0 })],
    ].map(([ms, fn]) => setTimeout(fn as () => void, ms as number));
    return () => seq.forEach(clearTimeout);
  }, [intro]);

  const shutter = mood === "shutter";
  const closed = !awake || blink || shutter;
  const lidT = intro && !awake ? "1s cubic-bezier(.22,1,.36,1)" : ".12s ease";
  const glow =
    mood === "working"
      ? hexToRgba(resolvedAccent, 0.55)
      : mood === "search"
      ? hexToRgba(resolvedAccent, 0.45)
      : mood === "shutter"
      ? hexToRgba(resolvedAccent, 0.95)
      : GLOW[mood];
  const ringStroke = hexToRgba(resolvedAccent, 0.9);

  const content = (
    <>
      <span
        className="absolute inset-[-6px] rounded-full blur-xl"
        style={{ background: glow, transition: "background .4s ease", opacity: shutter ? 1 : 0.8 }}
      />
      <svg viewBox="0 0 100 100" className="sm-breathe relative h-full w-full">
        <defs>
          <radialGradient id="ib" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#26263a" />
            <stop offset="100%" stopColor="#0c0c13" />
          </radialGradient>
          <radialGradient id="il" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="55%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#09090f" />
          </radialGradient>
          <clipPath id={`lid${size}`}>
            <ellipse cx="50" cy="50" rx="42" ry={closed ? 2 : 30} style={{ transition: `ry ${lidT}` }} />
          </clipPath>
        </defs>
        <ellipse
          cx="50"
          cy="50"
          rx="44"
          ry={closed ? 5 : 33}
          fill="url(#ib)"
          stroke="rgba(255,255,255,.12)"
          strokeWidth="1"
          style={{ transition: `ry ${lidT}` }}
        />
        <g clipPath={`url(#lid${size})`}>
          <circle cx={50 + pupil.x} cy={50 + pupil.y} r="21" fill="url(#il)" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path
              key={a}
              d="M0,-21 L11,-14 L4,0 Z"
              fill="#08080a"
              opacity=".92"
              transform={`translate(${50 + pupil.x},${50 + pupil.y}) rotate(${a}) scale(${shutter ? 1 : 0.34})`}
              style={{ transition: "transform .16s cubic-bezier(.4,0,.2,1)" }}
            />
          ))}
          <circle cx={50 + pupil.x} cy={50 + pupil.y} r={shutter ? 1.5 : 6.5} fill="#08080a" style={{ transition: "r .16s ease" }} />
          <circle cx={44 + pupil.x} cy={42 + pupil.y} r="4" fill="#fff" opacity=".85" />
          {(mood === "search" || mood === "working") && (
            <circle cx={50 + pupil.x} cy={50 + pupil.y} r="26" fill="none" stroke={ringStroke} strokeWidth="1.5" strokeDasharray="6 10">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${50 + pupil.x} ${50 + pupil.y}`}
                to={`360 ${50 + pupil.x} ${50 + pupil.y}`}
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
        <path d={SMILE[mood]} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2.2" strokeLinecap="round" style={{ transition: "d .3s ease" }} />
      </svg>
    </>
  );

  const style: React.CSSProperties = {
    width: size,
    height: size,
    transition: "transform .35s cubic-bezier(.34,1.56,.64,1)",
    transform: mood === "happy" ? "translateY(-4px)" : "none",
  };

  if (!onClick) {
    return (
      <div ref={box as React.RefObject<HTMLDivElement>} aria-hidden="true" className={`relative shrink-0 rounded-full ${className}`} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      ref={box as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      aria-label={ariaLabel ?? "Apri Iris"}
      className={`relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${className}`}
      style={style}
    >
      {content}
    </button>
  );
}
