import { Camera, Flame, Lock, Unlock, Search, MessageCircleHeart, Check } from "lucide-react";
import { fmt } from "../lib/date";
import { MOOD_EMOJI } from "../constants/moods";
import { questionOfDay } from "../constants/questions";
import { EmptyHint } from "./EmptyHint";
import { MemoryCard } from "./MemoryCard";
import type { Memory, Profile, WidgetId } from "../types";

interface WidgetContentProps {
  id: WidgetId;
  profile: Profile;
  doneToday: boolean;
  streak: number;
  items: Memory[];
  monthSpese: Memory[];
  totMese: number;
  eventi: Memory[];
  anniversary: Memory[];
  moods: Memory[];
  persone: Memory[];
  idee: Memory[];
  vaultOpen: boolean;
  userHasPin: boolean;
  answeredToday: boolean;
  fraseText: string;
  setFraseText: (v: string) => void;
  onOpenCapture: () => void;
  onOpenMemory: (m: Memory) => void;
  onOpenSpotlight: () => void;
  onSaveFrase: () => void;
  onToggleVault: () => void;
  onOpenPin: () => void;
  onToggleIdea: (m: Memory) => void;
}

export function WidgetContent(p: WidgetContentProps) {
  switch (p.id) {
    case "hero":
      return (
        <div className="flex flex-col items-center py-6 text-center">
          <p className="text-[11px] uppercase tracking-[.2em] text-amber-300/80">{fmt(new Date())}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {p.doneToday ? `Fatto per oggi, ${p.profile.nick}.` : "Il ricordo di oggi"}
          </h2>
          <p className="mt-1 text-sm text-white/60">{p.doneToday ? "Torna domani: ti aspetto." : "Uno scatto. Faccio io il resto."}</p>
          <button
            onClick={p.onOpenCapture}
            aria-label="Scatta un nuovo ricordo"
            className="group mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#08080A] shadow-[0_0_50px_rgba(251,191,36,.22)] transition-transform active:scale-90"
          >
            <Camera className="h-7 w-7 transition-transform group-hover:scale-110" strokeWidth={1.75} />
          </button>
        </div>
      );

    case "streak":
      return p.streak > 0 ? (
        <div className="flex h-full flex-col justify-center py-2 text-center">
          <Flame className={`mx-auto h-6 w-6 ${p.doneToday ? "text-amber-300" : "text-white/40"}`} strokeWidth={1.75} />
          <p className="mt-1 font-mono text-3xl font-semibold">{p.streak}</p>
          <p className="text-xs text-white/50">{p.streak === 1 ? "giorno" : "giorni di fila"}</p>
          {!p.doneToday && <p className="mt-1 text-[11px] text-white/45">oggi manca il tuo</p>}
        </div>
      ) : (
        <EmptyHint text="La fiamma si accende al primo ricordo." cta="Scatta" onCta={p.onOpenCapture} />
      );

    case "recenti":
      return p.items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {p.items.slice(0, 4).map((m) => (
            <MemoryCard key={m.id} m={m} onOpen={p.onOpenMemory} vaultOpen={p.vaultOpen} compact />
          ))}
        </div>
      ) : (
        <EmptyHint text={`Il tuo spazio è pronto, ${p.profile.nick}. Il primo ricordo lo riempie.`} cta="Scatta il primo" onCta={p.onOpenCapture} />
      );

    case "cerca":
      return (
        <button
          onClick={p.onOpenSpotlight}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-white/[.04] px-4 py-3 text-left text-white/55 ring-1 ring-white/[.06] transition hover:bg-white/[.07]"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} /> Chiedi a Iris… <kbd className="ml-auto hidden font-mono text-[10px] text-white/40 sm:inline">⌘K</kbd>
        </button>
      );

    case "speso":
      return p.monthSpese.length ? (
        <div className="py-1">
          <p className="font-mono text-2xl font-semibold text-amber-200">{p.totMese.toFixed(2)} €</p>
          <p className="text-xs text-white/50">
            {p.monthSpese.length} {p.monthSpese.length === 1 ? "scontrino" : "scontrini"} questo mese
          </p>
        </div>
      ) : (
        <EmptyHint text="Registra la prima spesa e comincio a fare i conti." cta="Scatta uno scontrino" onCta={p.onOpenCapture} />
      );

    case "evento": {
      const e = p.eventi[0];
      return e ? (
        <button onClick={() => p.onOpenMemory(e)} className="w-full text-left">
          <p className="text-[11px] uppercase tracking-[.14em] text-indigo-300/80">In evidenza</p>
          <p className="mt-1 font-semibold">{e.title}</p>
          <p className="text-sm text-white/60">{e.summary.slice(0, 60)}</p>
        </button>
      ) : (
        <EmptyHint text="Salva un biglietto o un invito: lo tengo d'occhio io." cta="Salva un evento" onCta={p.onOpenCapture} />
      );
    }

    case "vault":
      return (
        <div className="flex h-full flex-col justify-center py-2 text-center">
          {p.vaultOpen ? <Unlock className="mx-auto h-6 w-6 text-emerald-300" strokeWidth={1.75} /> : <Lock className="mx-auto h-6 w-6 text-white/45" strokeWidth={1.75} />}
          <button onClick={p.vaultOpen ? p.onToggleVault : p.onOpenPin} className="mt-2 text-sm text-white/70 transition hover:text-white">
            {p.vaultOpen ? "Chiudi" : p.userHasPin ? "Apri con PIN" : "Crea il tuo PIN"}
          </button>
        </div>
      );

    case "annofa": {
      const a = p.anniversary[0];
      return a ? (
        <button onClick={() => p.onOpenMemory(a)} className="w-full text-left">
          <p className="text-[11px] uppercase tracking-[.14em] text-orange-300/80">Un po' di tempo fa</p>
          <p className="mt-1 leading-snug text-white/75">{a.summary.slice(0, 80)}</p>
        </button>
      ) : null; // Il widget viene nascosto a monte finché non ha nulla da dire (vedi App.tsx).
    }

    case "umore":
      return p.moods.length ? (
        <div className="flex items-end justify-around gap-2 pt-2">
          {MOOD_EMOJI.map((e, i) => {
            const n = p.moods.filter((m) => m.mood === i).length;
            const max = Math.max(...MOOD_EMOJI.map((_, j) => p.moods.filter((m) => m.mood === j).length), 1);
            return (
              <div key={e} className="flex flex-col items-center gap-1">
                <div className="w-5 rounded-t bg-amber-300/40" style={{ height: `${8 + (n / max) * 40}px`, opacity: n ? 1 : 0.3 }} />
                <span className="text-sm" aria-hidden="true">
                  {e}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyHint text="Aggiungi un'emoji ai tuoi scatti e qui vedrai il mese." />
      );

    case "frase":
      return p.answeredToday ? (
        <div className="flex items-center gap-3 py-2">
          <MessageCircleHeart className="h-5 w-5 text-amber-300" strokeWidth={1.75} />
          <p className="text-sm text-white/65">Risposta di oggi salvata nei ricordi. A domani.</p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] uppercase tracking-[.14em] text-amber-300/80">Iris ti chiede</p>
          <p className="mt-1 font-semibold">{questionOfDay()}</p>
          <label htmlFor="frase-input" className="sr-only">
            Rispondi alla domanda del giorno
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="frase-input"
              value={p.fraseText}
              onChange={(e) => p.setFraseText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && p.onSaveFrase()}
              placeholder="Scrivi qui…"
              className="min-h-11 w-full rounded-2xl bg-white/[.05] px-4 text-sm outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-amber-300/60"
            />
            <button
              onClick={p.onSaveFrase}
              disabled={!p.fraseText.trim()}
              aria-label="Salva risposta"
              className="min-h-11 rounded-full bg-white px-4 font-semibold text-[#08080A] active:scale-95 disabled:opacity-40"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      );

    case "persone":
      return p.persone.length ? (
        <div className="flex flex-wrap gap-3">
          {p.persone.slice(0, 6).map((m) => (
            <button key={m.id} onClick={() => p.onOpenMemory(m)} className="flex flex-col items-center gap-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-400/15 font-semibold text-sky-200">{m.title[0]}</span>
              <span className="max-w-[64px] truncate text-[11px] text-white/55">{m.title.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyHint text="Salva una persona (un nome, un dettaglio) e la ritrovi qui." cta="Salva qualcuno" onCta={p.onOpenCapture} />
      );

    case "idee":
      return p.idee.length ? (
        <div className="space-y-2">
          {p.idee.slice(0, 4).map((m) => (
            <button key={m.id} onClick={() => p.onToggleIdea(m)} className="flex min-h-9 w-full items-center gap-2.5 rounded-xl px-2 text-left transition hover:bg-white/[.05]">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ring-1 ${m.done ? "bg-emerald-400/20 ring-emerald-300/50" : "ring-white/25"}`}>
                {m.done && <Check className="h-3 w-3 text-emerald-300" strokeWidth={2.5} />}
              </span>
              <span className={`text-sm ${m.done ? "text-white/40 line-through" : "text-white/80"}`}>{m.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyHint text="Le idee al volo finiscono qui: da provare, poi fatte." />
      );

    default:
      return null;
  }
}
