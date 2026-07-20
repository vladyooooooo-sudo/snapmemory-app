import { useRef, useState } from "react";
import { Volume2, VolumeX, RotateCcw, X, Download, Upload, Sparkles, Crown } from "lucide-react";
import { ACCENTS } from "../../constants/accents";
import { LIMITS } from "../../constants/LIMITS";
import { currentCount } from "../../lib/usage";
import { Modal } from "./Modal";
import type { AppStore } from "../../store/useAppStore";

interface SettingsModalProps {
  store: AppStore;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onUpgrade: () => void;
  onDowngrade: () => void;
}

export function SettingsModal({ store, onClose, onExport, onImport, onUpgrade, onDowngrade }: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { profile, sounds, setSounds, plan, accent, setAccent, usage, resetAll } = store;
  if (!profile) return null;

  const exportUsed = currentCount(usage.exportPerSettimana, "week");
  const exportLimit = LIMITS.export[plan];
  const canExport = exportLimit == null || exportUsed < exportLimit;

  return (
    <Modal onClose={onClose} labelledBy="settings-title" maxWidth="max-w-sm">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-4 flex items-center">
          <h3 id="settings-title" className="text-xl font-semibold tracking-tight">
            Impostazioni
          </h3>
          <button onClick={onClose} aria-label="Chiudi" className="ml-auto min-h-9 min-w-9 rounded-full p-1.5 text-white/50 hover:bg-white/10">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
            <p className="text-[11px] uppercase tracking-[.14em] text-white/55">Profilo</p>
            <p className="mt-1">
              {profile.name}
              {profile.nick !== profile.name && <span className="text-white/55"> · «{profile.nick}» per Iris</span>}
            </p>
            <p className="text-xs text-white/45">Tutto salvato solo sul tuo dispositivo.</p>
          </div>

          {/* ---- Il tuo piano ---- */}
          <div className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
            <div className="flex items-center gap-2">
              {plan === "pro" ? <Crown className="h-4 w-4 text-amber-300" strokeWidth={1.75} /> : <Sparkles className="h-4 w-4 text-white/50" strokeWidth={1.75} />}
              <p className="text-[11px] uppercase tracking-[.14em] text-white/55">Il tuo piano</p>
              <span className="ml-auto rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium">{plan === "pro" ? "Pro" : "Free"}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-white/70">
              <li>Ricordi al giorno: {plan === "pro" ? "illimitati" : `${LIMITS.memorie.free}`}</li>
              <li>Widget in dashboard: {plan === "pro" ? LIMITS.widget.pro : LIMITS.widget.free}</li>
              <li>Domande a Iris al giorno: {plan === "pro" ? "illimitate" : `${LIMITS.domandeIris.free}`}</li>
              <li>Cassaforte: {plan === "pro" ? "illimitata" : `fino a ${LIMITS.vault.free} elementi`}</li>
              <li>Export: {plan === "pro" ? "illimitati + backup automatico" : "1 a settimana"}</li>
            </ul>
            <div className="mt-3">
              {plan === "free" ? (
                <button onClick={onUpgrade} className="min-h-10 w-full rounded-full bg-white text-sm font-semibold text-[#08080A] active:scale-95">
                  Passa a Pro
                </button>
              ) : (
                <button onClick={onDowngrade} className="min-h-10 w-full rounded-full bg-white/[.06] text-sm text-white/70 ring-1 ring-white/10 active:scale-95">
                  Torna a Free
                </button>
              )}
            </div>
          </div>

          {/* ---- Aspetto ---- */}
          <div className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
            <p className="text-[11px] uppercase tracking-[.14em] text-white/55">Colore accento</p>
            <div className="mt-2 flex gap-2" role="group" aria-label="Colore accento">
              {ACCENTS.map((a, i) => {
                const locked = plan === "free" && i > 0;
                return (
                  <button
                    key={a.id}
                    onClick={() => !locked && setAccent(a.id)}
                    disabled={locked}
                    aria-pressed={accent === a.id}
                    aria-label={`${a.label}${locked ? " (Pro)" : ""}`}
                    className={`h-9 w-9 rounded-full ring-2 transition ${accent === a.id ? "ring-white" : "ring-transparent"} ${locked ? "opacity-30" : ""}`}
                    style={{ background: a.hex }}
                  />
                );
              })}
            </div>
            {plan === "free" && <p className="mt-2 text-xs text-white/45">Pro sblocca altri 4 colori accento.</p>}
          </div>

          <button
            onClick={() => setSounds(!sounds)}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05] transition hover:bg-white/[.06]"
          >
            {sounds ? <Volume2 className="h-4 w-4 text-amber-300" strokeWidth={1.75} /> : <VolumeX className="h-4 w-4 text-white/45" strokeWidth={1.75} />}
            <span className="text-sm">{sounds ? "Suoni attivi" : "Suoni disattivati"}</span>
            <span className={`ml-auto h-6 w-10 rounded-full p-0.5 transition ${sounds ? "bg-amber-300/80" : "bg-white/10"}`}>
              <span className={`block h-5 w-5 rounded-full bg-white transition ${sounds ? "translate-x-4" : ""}`} />
            </span>
          </button>

          {/* ---- Backup ---- */}
          <div className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
            <p className="text-[11px] uppercase tracking-[.14em] text-white/55">Backup</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => canExport && onExport()}
                disabled={!canExport}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[.05] text-sm text-white/80 ring-1 ring-white/10 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Esporta JSON
              </button>
              <button
                onClick={() => fileInput.current?.click()}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[.05] text-sm text-white/80 ring-1 ring-white/10"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.75} /> Importa
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImport(f);
                  e.target.value = "";
                }}
              />
            </div>
            {!canExport && <p className="mt-2 text-xs text-white/45">Hai già esportato questa settimana. Pro rimuove il limite.</p>}
          </div>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/[.03] p-4 text-white/70 ring-1 ring-white/[.05] transition hover:bg-white/[.06]"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-sm">Ricomincia da capo</span>
            </button>
          ) : (
            <div className="rounded-2xl bg-rose-400/10 p-4 ring-1 ring-rose-300/20">
              <p className="text-sm text-rose-200/90">Cancella tutto: profilo, ricordi, widget. Non si torna indietro.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={resetAll} className="min-h-9 rounded-full bg-rose-300 px-4 text-sm font-semibold text-[#08080A] active:scale-95">
                  Cancella tutto
                </button>
                <button onClick={() => setConfirmReset(false)} className="min-h-9 rounded-full bg-white/[.06] px-4 text-sm text-white/80 active:scale-95">
                  Annulla
                </button>
              </div>
            </div>
          )}
          <p className="pt-2 text-center text-[11px] text-white/40">Ideata e diretta da Vladyo — CEO & Founder</p>
        </div>
      </div>
    </Modal>
  );
}
