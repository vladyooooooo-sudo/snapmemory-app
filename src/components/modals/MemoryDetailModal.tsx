import { useState } from "react";
import { Lock, X, Plus, MapPin, Pencil, Trash2, Check, CalendarClock } from "lucide-react";
import { CATS } from "../../constants/categories";
import { MOOD_EMOJI } from "../../constants/moods";
import { fmt } from "../../lib/date";
import { downloadIcs } from "../../lib/ics";
import { expiryLabel, upcomingExpiries } from "../../lib/expiry";
import { Modal } from "./Modal";
import type { CategoryId, Memory } from "../../types";

interface MemoryDetailModalProps {
  memory: Memory;
  vaultOpen: boolean;
  onClose: () => void;
  onEdit: (id: string, patch: Partial<Pick<Memory, "title" | "cat" | "tags" | "amount" | "expiry">>) => void;
  onDelete: (id: string) => void;
  onRequestUnlock: () => void;
  onAction: (message: string) => void;
}

export function MemoryDetailModal({ memory, vaultOpen, onClose, onEdit, onDelete, onRequestUnlock, onAction }: MemoryDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(memory.title);
  const [cat, setCat] = useState<CategoryId>(memory.cat);
  const [tags, setTags] = useState(memory.tags.join(", "));
  const [amount, setAmount] = useState(memory.amount != null ? String(memory.amount) : "");
  const [expiry, setExpiry] = useState(memory.expiry ?? "");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  const hidden = memory.locked && !vaultOpen;
  const expiryInfo = memory.expiry ? upcomingExpiries([memory], 100000)[0] : null;

  const save = () => {
    const parsedAmount = amount.trim() ? parseFloat(amount.replace(",", ".")) : undefined;
    onEdit(memory.id, {
      title: title.trim() || memory.title,
      cat,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      amount: Number.isFinite(parsedAmount) ? parsedAmount : undefined,
      expiry: expiry || undefined,
    });
    setEditing(false);
  };

  return (
    <Modal onClose={onClose} labelledBy="detail-title">
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          {(() => {
            const C = CATS[cat];
            return <C.Icon className={`h-4 w-4 ${C.tint}`} strokeWidth={1.75} />;
          })()}
          <span className="text-[11px] uppercase tracking-[.14em] text-white/55">
            {CATS[cat].label} · {fmt(memory.date)}
          </span>
          {memory.mood != null && <span aria-hidden="true">{MOOD_EMOJI[memory.mood]}</span>}
          <button onClick={onClose} aria-label="Chiudi" className="ml-auto min-h-9 min-w-9 rounded-full p-1.5 text-white/50 hover:bg-white/10">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-title" className="text-[11px] uppercase tracking-[.14em] text-white/55">
                Titolo
              </label>
              <input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
              />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[.14em] text-white/55">Categoria</span>
              <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label="Categoria del ricordo">
                {Object.entries(CATS).map(([k, c]) => (
                  <button
                    key={k}
                    onClick={() => setCat(k as CategoryId)}
                    aria-pressed={cat === k}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${
                      cat === k ? "bg-white font-medium text-[#08080A]" : "bg-white/[.05] text-white/70"
                    }`}
                  >
                    <c.Icon className={`h-3.5 w-3.5 ${cat === k ? "" : c.tint}`} strokeWidth={1.75} /> {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="edit-tags" className="text-[11px] uppercase tracking-[.14em] text-white/55">
                Tag (separati da virgola)
              </label>
              <input
                id="edit-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="edit-amount" className="text-[11px] uppercase tracking-[.14em] text-white/55">
                  Importo (€)
                </label>
                <input
                  id="edit-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="edit-expiry" className="text-[11px] uppercase tracking-[.14em] text-white/55">
                  Scadenza
                </label>
                <input
                  id="edit-expiry"
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-[#08080A] active:scale-[.98]">
                <Check className="h-4 w-4" strokeWidth={2} /> Salva modifiche
              </button>
              <button onClick={() => setEditing(false)} className="min-h-11 rounded-2xl bg-white/[.06] px-4 text-sm text-white/80">
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold tracking-tight">{memory.title}</h3>
            <div className="rounded-2xl bg-black/40 p-4 ring-1 ring-white/[.05]">
              <p className="mb-2 text-[10px] uppercase tracking-[.14em] text-white/45">Testo letto da Iris</p>
              <p className={`font-mono text-sm leading-relaxed text-emerald-200/80 ${hidden ? "blur-[5px] select-none" : ""}`}>
                {memory.ocr}
              </p>
              {hidden && (
                <button onClick={onRequestUnlock} className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm text-white/70 hover:text-white">
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.75} /> Sblocca
                </button>
              )}
            </div>
            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((t) => (
                  <span key={t} className="rounded-full bg-white/[.05] px-3 py-1 text-xs text-white/60">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {memory.amount != null && <p className="font-mono text-lg text-amber-200">{memory.amount.toFixed(2)} €</p>}

            {expiryInfo && (
              <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${expiryInfo.daysLeft <= 3 ? "bg-rose-400/15 text-rose-200" : "bg-amber-300/10 text-amber-200/90"}`}>
                <CalendarClock className="h-4 w-4" strokeWidth={1.75} /> {expiryLabel(expiryInfo.daysLeft)}
              </p>
            )}

            {memory.cat === "evento" && (
              <div className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
                <p className="text-[11px] uppercase tracking-[.14em] text-white/55">Quando è l'evento?</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    aria-label="Data dell'evento"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="flex-1 rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
                  />
                  <input
                    type="time"
                    aria-label="Ora dell'evento (opzionale)"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-28 rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!eventDate) return;
                    downloadIcs(memory, eventDate, eventTime || undefined);
                    onAction("Evento pronto per il calendario");
                  }}
                  disabled={!eventDate}
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] active:scale-[.98] disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} /> Aggiungi al calendario
                </button>
              </div>
            )}
            {memory.cat === "luogo" && (
              <button
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(memory.summary.slice(0, 120))}`, "_blank", "noopener");
                  onAction("Apro le mappe");
                }}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] active:scale-[.98]"
              >
                <MapPin className="h-4 w-4" strokeWidth={2} /> Portami lì
              </button>
            )}

            {!confirmDelete ? (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/[.05] text-sm text-white/80 ring-1 ring-white/10 transition hover:bg-white/[.08]"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Modifica
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-rose-400/10 text-sm text-rose-300/90 ring-1 ring-rose-300/20 transition hover:bg-rose-400/15"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Elimina
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-rose-400/10 p-4 ring-1 ring-rose-300/20">
                <p className="text-sm text-rose-200/90">Eliminare questo ricordo? Non si torna indietro.</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      onDelete(memory.id);
                      onClose();
                    }}
                    className="min-h-9 rounded-full bg-rose-300 px-4 text-sm font-semibold text-[#08080A] active:scale-95"
                  >
                    Elimina
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="min-h-9 rounded-full bg-white/[.06] px-4 text-sm text-white/80 active:scale-95">
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
