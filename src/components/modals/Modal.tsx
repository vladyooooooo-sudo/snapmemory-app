import { useRef, type ReactNode } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
  align?: "center" | "bottom";
  maxWidth?: string;
}

export function Modal({ onClose, children, labelledBy, align = "bottom", maxWidth = "max-w-lg" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        align === "center" ? "items-center" : "items-end sm:items-center"
      } justify-center bg-black/75 p-0 backdrop-blur-md sm:p-6`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`sm-rise w-full ${maxWidth} overflow-hidden rounded-t-3xl border border-white/10 bg-[#0e0e15]/95 backdrop-blur-xl sm:rounded-3xl`}
      >
        {children}
      </div>
    </div>
  );
}
