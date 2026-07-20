import { Iris } from "../Iris";
import { Modal } from "./Modal";
import type { LimitResult } from "../../types";

interface UpgradeModalProps {
  feature: string;
  limit: LimitResult;
  onClose: () => void;
  onUpgrade: () => void;
}

function formatResetAt(d: Date | null): string {
  if (!d) return "";
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const day = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" });
  return today ? `oggi a mezzanotte` : `${day} alle ${time}`;
}

/** Modale gentile, mai a piena pagina bloccante: spiega, non minaccia. */
export function UpgradeModal({ feature, limit, onClose, onUpgrade }: UpgradeModalProps) {
  return (
    <Modal onClose={onClose} labelledBy="upgrade-title" align="center" maxWidth="max-w-sm">
      <div className="flex flex-col items-center p-6 text-center">
        <Iris mood="sad" size={72} />
        <h3 id="upgrade-title" className="mt-4 text-xl font-semibold tracking-tight">
          Hai raggiunto il limite di oggi
        </h3>
        <p className="mt-2 text-sm text-white/65">
          {feature}: {limit.limit != null ? `hai usato tutte le ${limit.limit} disponibili nel piano Free.` : ""}
          {limit.resetAt && ` Si sblocca di nuovo ${formatResetAt(limit.resetAt)}.`}
        </p>
        <p className="mt-2 text-sm text-white/50">Oppure passa a Pro quando vuoi: nessuna fretta, nessun countdown.</p>
        <div className="mt-6 flex w-full gap-2">
          <button onClick={onClose} className="min-h-11 flex-1 rounded-full bg-white/[.06] text-sm text-white/80 ring-1 ring-white/10">
            Va bene, aspetto
          </button>
          <button onClick={onUpgrade} className="min-h-11 flex-1 rounded-full bg-white text-sm font-semibold text-[#08080A]">
            Scopri Pro
          </button>
        </div>
      </div>
    </Modal>
  );
}
