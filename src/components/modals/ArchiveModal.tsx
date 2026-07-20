import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { CATS } from "../../constants/categories";
import { MemoryCard } from "../MemoryCard";
import { EmptyHint } from "../EmptyHint";
import { Modal } from "./Modal";
import type { CategoryId, Memory } from "../../types";

interface ArchiveModalProps {
  items: Memory[];
  vaultOpen: boolean;
  onClose: () => void;
  onOpenMemory: (m: Memory) => void;
}

export function ArchiveModal({ items, vaultOpen, onClose, onOpenMemory }: ArchiveModalProps) {
  const [cat, setCat] = useState<CategoryId | "tutte">("tutte");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minAmount, setMinAmount] = useState("");

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (cat !== "tutte" && m.cat !== cat) return false;
      if (from && new Date(m.date) < new Date(from)) return false;
      if (to && new Date(m.date) > new Date(`${to}T23:59:59`)) return false;
      if (minAmount) {
        const min = parseFloat(minAmount.replace(",", "."));
        if (!Number.isFinite(min) || (m.amount ?? -Infinity) < min) return false;
      }
      return true;
    });
  }, [items, cat, from, to, minAmount]);

  return (
    <Modal onClose={onClose} labelledBy="archive-title" maxWidth="max-w-3xl">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-4 flex items-center">
          <h3 id="archive-title" className="text-xl font-semibold tracking-tight">
            Tutti i ricordi
          </h3>
          <button onClick={onClose} aria-label="Chiudi" className="ml-auto min-h-9 min-w-9 rounded-full p-1.5 text-white/50 hover:bg-white/10">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="arch-cat" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Categoria
            </label>
            <select
              id="arch-cat"
              value={cat}
              onChange={(e) => setCat(e.target.value as CategoryId | "tutte")}
              className="mt-1 block rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
            >
              <option value="tutte">Tutte</option>
              {Object.entries(CATS).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="arch-from" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Dal
            </label>
            <input
              id="arch-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
            />
          </div>
          <div>
            <label htmlFor="arch-to" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Al
            </label>
            <input
              id="arch-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
            />
          </div>
          <div>
            <label htmlFor="arch-amount" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Importo minimo (€)
            </label>
            <input
              id="arch-amount"
              inputMode="decimal"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="mt-1 block w-28 rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
            />
          </div>
        </div>

        {filtered.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((m) => (
              <MemoryCard key={m.id} m={m} onOpen={onOpenMemory} vaultOpen={vaultOpen} />
            ))}
          </div>
        ) : (
          <EmptyHint text="Nessun ricordo corrisponde a questi filtri." />
        )}
      </div>
    </Modal>
  );
}
