import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { haptic } from "../../lib/haptics";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
  align?: "center" | "bottom";
  maxWidth?: string;
}

const DISMISS_THRESHOLD = 90;

/**
 * Modale con comportamento da bottom sheet su mobile: si trascina verso il
 * basso per chiudere (pointer events, quindi touch e mouse), con maniglia
 * visibile. Su desktop resta il click fuori + Escape.
 */
export function Modal({ onClose, children, labelledBy, align = "bottom", maxWidth = "max-w-lg" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  useFocusTrap(panelRef, true);

  const isSheet = align === "bottom";

  const onHandleDown = (e: PointerEvent) => {
    dragStart.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: PointerEvent) => {
    if (dragStart.current == null) return;
    setDragY(Math.max(0, e.clientY - dragStart.current));
  };
  const onHandleUp = () => {
    if (dragStart.current == null) return;
    if (dragY > DISMISS_THRESHOLD) {
      haptic(8);
      onClose();
    }
    dragStart.current = null;
    setDragY(0);
  };

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
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragY ? "none" : "transform .3s cubic-bezier(.22,1,.36,1)",
          opacity: dragY ? Math.max(0.5, 1 - dragY / 500) : undefined,
        }}
        className={`sm-rise w-full ${maxWidth} overflow-hidden rounded-t-3xl border border-white/10 bg-[#0e0e15]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:rounded-3xl sm:pb-0`}
      >
        {isSheet && (
          <div
            className="flex cursor-grab touch-none justify-center pb-1 pt-2.5 sm:hidden"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            aria-hidden="true"
          >
            <span className="h-1.5 w-10 rounded-full bg-white/20" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
