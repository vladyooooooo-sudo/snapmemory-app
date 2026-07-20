import { CATS } from "../constants/categories";
import { MOOD_EMOJI } from "../constants/moods";
import { fmt } from "../lib/date";
import type { Memory } from "../types";
import { Hi } from "./Hi";
import { Lock } from "lucide-react";

interface MemoryCardProps {
  m: Memory;
  onOpen: (m: Memory) => void;
  vaultOpen: boolean;
  words?: string[];
  compact?: boolean;
}

export function MemoryCard({ m, onOpen, vaultOpen, words, compact }: MemoryCardProps) {
  const C = CATS[m.cat];
  const hidden = m.locked && !vaultOpen;
  return (
    <button
      onClick={() => onOpen(m)}
      className="group relative w-full overflow-hidden rounded-2xl bg-white/[.035] p-4 text-left ring-1 ring-white/[.06] transition hover:bg-white/[.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-[.985]"
    >
      <div className="flex items-center gap-2">
        <C.Icon className={`h-4 w-4 ${C.tint}`} strokeWidth={1.75} />
        <span className="text-[11px] uppercase tracking-[.14em] text-white/55">{C.label}</span>
        {m.mood != null && (
          <span className="text-sm" aria-label={`Umore: ${["sereno", "neutro", "nuvoloso", "intenso", "speciale"][m.mood]}`}>
            {MOOD_EMOJI[m.mood]}
          </span>
        )}
        {m.locked && <Lock className="ml-auto h-3.5 w-3.5 text-white/45" strokeWidth={1.75} aria-label="Ricordo riservato" />}
      </div>
      <h3 className="mt-2 text-[15px] font-semibold leading-tight text-white">
        <Hi text={m.title} words={words} />
      </h3>
      {!compact && (
        <p className={`mt-1 text-[13px] text-white/60 ${hidden ? "blur-[6px] select-none" : ""}`}>
          {hidden ? "•••• protetto ••••" : <Hi text={m.summary.slice(0, 90)} words={words} />}
        </p>
      )}
      <div className="mt-2 flex items-center text-[11px] text-white/45">
        <span>{fmt(m.date)}</span>
        {m.amount != null && <span className="ml-auto font-mono text-amber-300/90">{m.amount.toFixed(2)} €</span>}
      </div>
    </button>
  );
}
