import { useEffect, useRef, useState } from "react";
import { Iris } from "../Iris";
import { hashPin, verifyPin, generateSalt } from "../../lib/pin";
import { usePinLockout } from "../../hooks/usePinLockout";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface PinModalProps {
  mode: "set" | "ask";
  pinHash: string | null;
  pinSalt: string | null;
  onClose: () => void;
  onSet: (salt: string, hash: string) => void;
  onUnlock: () => void;
}

const PAD: (number | "")[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0];

export function PinModal({ mode, pinHash, pinSalt, onClose, onSet, onUnlock }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [pinFirst, setPinFirst] = useState("");
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { isLocked, lockedSeconds, registerFailure, registerSuccess } = usePinLockout();

  useFocusTrap(panelRef, true);

  // Bug corretto: nessun setTimeout veniva pulito allo smontaggio del modale
  // (es. l'utente chiude durante l'attesa): qui ogni timer è tracciato e
  // annullato al cleanup, per evitare setState su un componente smontato.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  const shakeNow = () => {
    setShake(true);
    after(() => setShake(false), 400);
  };

  const push = async (n: number | "←") => {
    if (isLocked || checking) return;
    if (n === "←") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const np = (pin + n).slice(0, 4);
    setPin(np);
    if (np.length < 4) return;

    setChecking(true);
    after(async () => {
      if (mode === "set") {
        if (!pinFirst) {
          setPinFirst(np);
          setPin("");
          setChecking(false);
          return;
        }
        if (pinFirst === np) {
          const salt = generateSalt();
          const hash = await hashPin(np, salt);
          onSet(salt, hash);
          registerSuccess();
        } else {
          setPin("");
          setPinFirst("");
          shakeNow();
          registerFailure();
        }
      } else {
        const ok = pinHash && pinSalt ? await verifyPin(np, pinSalt, pinHash) : false;
        if (ok) {
          onUnlock();
          registerSuccess();
        } else {
          setPin("");
          shakeNow();
          registerFailure();
        }
      }
      setChecking(false);
    }, 180);
  };

  const title = mode === "set" ? (pinFirst ? "Ripeti il PIN" : "Crea il tuo PIN") : "Inserisci il PIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-title"
        onClick={(e) => e.stopPropagation()}
        className={`sm-rise w-full max-w-xs rounded-3xl border border-white/10 bg-[#0e0e15] p-6 text-center ${shake ? "sm-shake" : ""}`}
      >
        <Iris mood={shake ? "alert" : "idle"} size={56} className="mx-auto" />
        <p id="pin-title" className="mt-3 font-semibold">
          {title}
        </p>
        {mode === "set" && !pinFirst && <p className="mt-1 text-xs text-white/50">4 cifre, solo tue. Proteggerà le cose riservate.</p>}
        {isLocked && (
          <p className="mt-2 text-xs text-rose-300/90" role="alert">
            Troppi tentativi. Riprova in {lockedSeconds}s.
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-3 w-3 rounded-full transition ${pin.length > i ? "bg-amber-300" : "bg-white/20"}`} />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {PAD.map((n, i) => (
            <button
              key={i}
              disabled={n === "" || isLocked || checking}
              onClick={() => n !== "" && push(n)}
              aria-label={n === "" ? undefined : `Cifra ${n}`}
              className="min-h-12 rounded-2xl bg-white/[.05] font-mono text-lg transition hover:bg-white/[.09] active:scale-95 disabled:opacity-0"
            >
              {n}
            </button>
          ))}
          <button
            disabled={isLocked || checking}
            onClick={() => push("←")}
            aria-label="Cancella ultima cifra"
            className="min-h-12 rounded-2xl bg-white/[.05] font-mono text-lg transition hover:bg-white/[.09] active:scale-95 disabled:opacity-40"
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
}
