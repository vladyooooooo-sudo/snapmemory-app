import { Iris } from "./Iris";
import type { IrisMood } from "../types";

interface EmptyHintProps {
  /** Default "idle": uno stato vuoto non è triste, è solo in attesa. */
  mood?: IrisMood;
  text: string;
  cta?: string;
  onCta?: () => void;
}

export function EmptyHint({ mood = "idle", text, cta, onCta }: EmptyHintProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      {/* Iris qui è decorativa: nessun onClick, quindi Iris non renderizza
          un <button> vuoto che riceverebbe comunque il focus da tastiera. */}
      <Iris mood={mood} size={52} />
      <p className="max-w-[22ch] text-sm text-white/60">{text}</p>
      {cta && (
        <button
          onClick={onCta}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/[.06] px-4 text-sm text-white/80 transition hover:bg-white/10 active:scale-95"
        >
          {cta}
        </button>
      )}
    </div>
  );
}
