import { Check, X } from "lucide-react";
import { WIDGET_META } from "../../constants/widgets";
import { Modal } from "./Modal";
import type { LimitResult, WidgetInstance } from "../../types";

interface LibraryModalProps {
  widgets: WidgetInstance[];
  limit: LimitResult;
  onClose: () => void;
  onAdd: (id: WidgetInstance["id"]) => void;
}

export function LibraryModal({ widgets, limit, onClose, onAdd }: LibraryModalProps) {
  return (
    <Modal onClose={onClose} labelledBy="library-title" maxWidth="max-w-lg">
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <div className="mb-1 flex items-center">
          <h3 id="library-title" className="text-xl font-semibold tracking-tight">
            Libreria widget
          </h3>
          <button onClick={onClose} aria-label="Chiudi" className="ml-auto min-h-9 min-w-9 rounded-full p-1.5 text-white/50 hover:bg-white/10">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        {limit.limit != null && (
          <p className="mb-4 text-xs text-white/50">
            {widgets.length} su {limit.limit} widget usati {limit.remaining === 0 ? "· passa a Pro per aggiungerne altri" : ""}
          </p>
        )}
        <div className="space-y-2">
          {Object.entries(WIDGET_META).map(([id, meta]) => {
            const added = widgets.some((w) => w.id === id);
            const disabled = added || (!limit.allowed && !added);
            return (
              <div key={id} className="flex items-center gap-3 rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05]">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{meta.name}</p>
                  <p className="text-sm text-white/55">{meta.desc}</p>
                </div>
                <button
                  onClick={() => !disabled && onAdd(id as WidgetInstance["id"])}
                  disabled={disabled}
                  className={`min-h-9 shrink-0 rounded-full px-4 text-sm transition active:scale-95 ${
                    added ? "bg-white/[.05] text-white/40" : disabled ? "bg-white/[.05] text-white/30" : "bg-white font-medium text-[#08080A]"
                  }`}
                >
                  {added ? <Check className="h-4 w-4" strokeWidth={2} /> : "Aggiungi"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
