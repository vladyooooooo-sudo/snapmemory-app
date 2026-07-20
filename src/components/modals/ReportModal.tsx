import { useMemo, useRef, useState } from "react";
import { Share2, X } from "lucide-react";
import { MOOD_EMOJI } from "../../constants/moods";
import { buildMonthlyReport, renderReportToCanvas, shareOrDownloadReport } from "../../lib/report";
import { EmptyHint } from "../EmptyHint";
import { MemoryCard } from "../MemoryCard";
import { Modal } from "./Modal";
import { haptic } from "../../lib/haptics";
import type { Memory } from "../../types";

interface ReportModalProps {
  items: Memory[];
  nick: string;
  vaultOpen: boolean;
  onClose: () => void;
  onOpenMemory: (m: Memory) => void;
  onShared: () => void;
}

/** «La tua vita in un colpo d'occhio»: il mese raccontato da chi c'era. */
export function ReportModal({ items, nick, vaultOpen, onClose, onOpenMemory, onShared }: ReportModalProps) {
  const report = useMemo(() => buildMonthlyReport(items), [items]);
  const [sharing, setSharing] = useState(false);
  const busyRef = useRef(false);

  const share = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSharing(true);
    haptic(10);
    try {
      const canvas = renderReportToCanvas(report, nick);
      await shareOrDownloadReport(canvas, report.monthLabel);
      onShared();
    } finally {
      busyRef.current = false;
      setSharing(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy="report-title" maxWidth="max-w-md">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-1 flex items-center">
          <h3 id="report-title" className="text-xl font-semibold tracking-tight">
            Il tuo mese
          </h3>
          <button onClick={onClose} aria-label="Chiudi" className="ml-auto min-h-9 min-w-9 rounded-full p-1.5 text-white/50 hover:bg-white/10">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <p className="mb-5 text-sm text-white/55">
          {report.monthLabel} · raccontato da Iris, che c'era.
        </p>

        {report.totalMemories === 0 ? (
          <EmptyHint text="Questo mese è ancora tutto da scrivere. Il primo scatto lo apre." />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                [String(report.totalMemories), report.totalMemories === 1 ? "ricordo" : "ricordi"],
                [`${report.totalSpent.toFixed(2)} €`, "spesi e tracciati"],
                [String(report.peopleCount), "persone"],
                [String(report.placesCount), "luoghi"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
                  <p className="font-mono text-2xl font-semibold text-amber-200">{v}</p>
                  <p className="text-xs text-white/55">{l}</p>
                </div>
              ))}
            </div>

            {report.spentByCategory.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[.14em] text-white/55">Dove sono andati</p>
                <div className="space-y-1.5">
                  {report.spentByCategory.slice(0, 4).map((row) => {
                    const max = report.spentByCategory[0].total || 1;
                    return (
                      <div key={row.cat} className="flex items-center gap-2 text-sm">
                        <span className="w-20 shrink-0 text-white/70">{row.label}</span>
                        <span className="h-5 rounded bg-amber-300/35" style={{ width: `${Math.max(8, (row.total / max) * 100)}%` }} />
                        <span className="ml-auto shrink-0 font-mono text-white/85">{row.total.toFixed(2)} €</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {report.prevailingMood != null && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
                <span className="text-3xl" aria-hidden="true">
                  {MOOD_EMOJI[report.prevailingMood]}
                </span>
                <p className="text-sm text-white/70">L'umore che ha colorato il mese.</p>
              </div>
            )}

            {report.bestMemory && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[.14em] text-white/55">Il momento del mese</p>
                <MemoryCard m={report.bestMemory} onOpen={onOpenMemory} vaultOpen={vaultOpen} />
              </div>
            )}

            <button
              onClick={share}
              disabled={sharing}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] transition active:scale-[.98] disabled:opacity-40"
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} /> {sharing ? "Preparo l'immagine…" : "Condividi come immagine"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
