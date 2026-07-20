import { Search, Sparkles, X } from "lucide-react";
import { Iris } from "../Iris";
import { EmptyHint } from "../EmptyHint";
import { MemoryCard } from "../MemoryCard";
import { Modal } from "./Modal";
import type { Memory } from "../../types";

export interface AskAnswer {
  loading?: boolean;
  reply?: string;
  proofs?: Memory[];
}

interface SpotlightModalProps {
  q: string;
  setQ: (q: string) => void;
  items: Memory[];
  answer: AskAnswer | null;
  vaultOpen: boolean;
  words: string[];
  limitReached: boolean;
  onClose: () => void;
  onAsk: (text: string) => void;
  onOpenMemory: (m: Memory) => void;
  onCreateNew: () => void;
}

export function SpotlightModal({ q, setQ, items, answer, vaultOpen, words, limitReached, onClose, onAsk, onOpenMemory, onCreateNew }: SpotlightModalProps) {
  return (
    <Modal onClose={onClose} labelledBy="spotlight-title" align="center" maxWidth="max-w-xl">
      <div className="flex items-center gap-3 border-b border-white/[.07] px-5 py-4">
        <Sparkles className="h-5 w-5 text-amber-300" strokeWidth={1.75} aria-hidden="true" />
        <label htmlFor="spotlight-input" className="sr-only">
          Chiedi a Iris
        </label>
        <h2 id="spotlight-title" className="sr-only">
          Cerca nei tuoi ricordi
        </h2>
        <input
          id="spotlight-input"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !limitReached && onAsk(q)}
          placeholder="Chiedi in parole tue…"
          className="w-full bg-transparent text-lg outline-none placeholder:text-white/35"
        />
        <button onClick={onClose} aria-label="Chiudi" className="min-h-9 min-w-9 rounded-full p-1.5 text-white/50 hover:bg-white/10">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="max-h-[50vh] overflow-y-auto p-5">
        {limitReached && (
          <p className="mb-3 rounded-xl bg-amber-300/10 px-3 py-2 text-sm text-amber-200/90">
            Hai usato tutte le domande di oggi. Passa a Pro per farne senza limite.
          </p>
        )}
        {!answer &&
          (items.length ? (
            <div className="space-y-1">
              <p className="mb-2 text-[11px] uppercase tracking-[.14em] text-white/50">Prova a chiedere</p>
              {["Quanto ho speso questa settimana?", "Dove ho parcheggiato?", ...items.slice(0, 2).map((m) => m.title + "?")].map((s) => (
                <button
                  key={s}
                  onClick={() => !limitReached && onAsk(s)}
                  disabled={limitReached}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-white/75 transition hover:bg-white/[.06] disabled:opacity-40"
                >
                  <Search className="h-3.5 w-3.5 text-white/40" strokeWidth={1.75} /> {s}
                </button>
              ))}
            </div>
          ) : (
            <EmptyHint text="Quando avrai ricordi, potrai chiedermi qualsiasi cosa su di loro." cta="Salva il primo" onCta={onCreateNew} />
          ))}
        {answer?.loading && (
          <div className="flex items-center gap-3 text-white/60">
            <Iris mood="search" size={44} /> Sto guardando tra i tuoi ricordi…
          </div>
        )}
        {answer && !answer.loading && (
          <div className="space-y-4">
            <p className="text-lg leading-relaxed">{answer.reply}</p>
            {answer.proofs && answer.proofs.length > 0 ? (
              <>
                <p className="text-[11px] uppercase tracking-[.14em] text-white/50">La prova</p>
                <div className="grid grid-cols-2 gap-3">
                  {answer.proofs.map((m) => (
                    <MemoryCard key={m.id} m={m} words={words} onOpen={onOpenMemory} vaultOpen={vaultOpen} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyHint text="Iris non ha ancora un ricordo su questo. Vuoi crearlo ora?" cta="Crealo adesso" onCta={onCreateNew} />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
