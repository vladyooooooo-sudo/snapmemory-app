import { Iris } from "../Iris";
import type { Celebration } from "../../store/useAppStore";

interface CelebrateModalProps {
  celebrate: Celebration;
  onClose: () => void;
}

export function CelebrateModal({ celebrate, onClose }: CelebrateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="celebrate-title">
      <div className="sm-rise flex flex-col items-center px-6 text-center" onClick={(e) => e.stopPropagation()}>
        <Iris mood="happy" size={120} />
        <h3 id="celebrate-title" className="mt-6 text-3xl font-semibold tracking-tight">
          {celebrate.title}
        </h3>
        <p className="mt-2 text-white/65">{celebrate.sub}</p>
        <button onClick={onClose} className="mt-8 min-h-11 rounded-full bg-white px-8 py-3 font-semibold text-[#08080A] active:scale-95">
          Chiudi
        </button>
      </div>
    </div>
  );
}
