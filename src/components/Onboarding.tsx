import { useState } from "react";
import { ArrowRight, Camera, Check } from "lucide-react";
import { Iris } from "./Iris";
import { CATS } from "../constants/categories";
import type { CategoryId } from "../types";

interface OnboardingProps {
  onFinish: (name: string, nick: string, cats: CategoryId[], firstSnap: boolean) => void;
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [nick, setNick] = useState("");
  const [cats, setCats] = useState<CategoryId[]>([]);

  /**
   * Bug corretto: nel prototipo "Salta tutto" faceva setObName("Tu") seguito
   * da un setTimeout(finishOnboarding, 0), ma finishOnboarding era una
   * closure del render corrente e leggeva ancora obName === "". Qui invece
   * il nome finale si calcola subito, nello stesso render, ed è passato
   * come argomento — nessuna lettura di stato stantio.
   */
  const finish = (firstSnap: boolean) => {
    const finalName = name.trim() || "Tu";
    onFinish(finalName, nick.trim(), cats, firstSnap);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#08080A] px-6 text-center text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      {step === 0 && (
        <>
          <Iris mood="idle" size={120} intro />
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Ciao. Sono Iris.</h1>
          <p className="mt-3 max-w-xs leading-relaxed text-white/70">
            Salvo le cose che non vuoi dimenticare. Uno scatto al giorno, il resto lo faccio io.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-[#08080A] active:scale-95"
          >
            Iniziamo <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <Iris mood="idle" size={80} />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Come ti chiami?</h1>
          <label htmlFor="ob-name" className="sr-only">
            Il tuo nome
          </label>
          <input
            id="ob-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(2)}
            placeholder="Il tuo nome"
            className="mt-6 w-full max-w-xs rounded-2xl bg-white/[.05] px-5 py-4 text-center text-lg outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-amber-300/60"
          />
          <label htmlFor="ob-nick" className="sr-only">
            Come vuoi che ti chiami io (opzionale)
          </label>
          <input
            id="ob-nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="Come vuoi che ti chiami io? (opzionale)"
            className="mt-3 w-full max-w-xs rounded-2xl bg-white/[.05] px-5 py-3 text-center text-sm outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-amber-300/60"
          />
          <p className="mt-3 text-xs text-white/45">
            Tutto resta sul tuo dispositivo. Niente account, niente email.
            <br />
            Lingua e ora: {Intl.DateTimeFormat().resolvedOptions().timeZone} · rilevate da sole.
          </p>
          <button
            onClick={() => name.trim() && setStep(2)}
            disabled={!name.trim()}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-[#08080A] active:scale-95 disabled:opacity-40"
          >
            Avanti <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <Iris mood="idle" size={80} />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Cosa ti serve ricordare?</h1>
          <p className="mt-2 text-sm text-white/60">Scegline 2–4. Le altre restano nel menu, più in disparte.</p>
          <div className="mt-6 flex max-w-sm flex-wrap justify-center gap-2" role="group" aria-label="Categorie da seguire">
            {Object.entries(CATS).map(([k, c]) => {
              const on = cats.includes(k as CategoryId);
              return (
                <button
                  key={k}
                  onClick={() =>
                    setCats((s) => (on ? s.filter((x) => x !== k) : s.length < 4 ? [...s, k as CategoryId] : s))
                  }
                  aria-pressed={on}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition active:scale-95 ${
                    on ? "bg-white font-medium text-[#08080A]" : "bg-white/[.05] text-white/70 ring-1 ring-white/10"
                  }`}
                >
                  <c.Icon className={`h-4 w-4 ${on ? "" : c.tint}`} strokeWidth={1.75} /> {c.label}
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={cats.length < 2}
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-[#08080A] active:scale-95 disabled:opacity-40"
          >
            Avanti <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <Iris mood="happy" size={100} />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Salviamo il primo ricordo{nick ? ", " + nick.trim() : ""}?
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">
            Bastano tre secondi. Oppure entra e guardati intorno: il tuo spazio è pronto.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => finish(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#08080A] active:scale-95"
            >
              <Camera className="h-4 w-4" strokeWidth={1.75} /> Scatta ora
            </button>
            <button
              onClick={() => finish(false)}
              className="min-h-11 rounded-full bg-white/[.06] px-6 py-3 text-white/80 ring-1 ring-white/10 active:scale-95"
            >
              Più tardi
            </button>
          </div>
        </>
      )}

      {step > 0 && (
        <button onClick={() => finish(false)} className="mt-8 text-sm text-white/50 hover:text-white/80">
          Salta tutto
        </button>
      )}

      <div className="mt-6 flex gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={3}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-amber-300" : "w-1.5 bg-white/25"}`} />
        ))}
      </div>
    </div>
  );
}
