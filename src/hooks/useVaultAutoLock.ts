import { useEffect, useRef } from "react";

const AUTO_LOCK_MS = 90_000; // 90s di inattività
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll"] as const;

/**
 * La cassaforte, una volta aperta, si blocca da sola dopo un periodo di
 * inattività e immediatamente quando l'app va in background (tab non
 * visibile o app minimizzata), invece di restare aperta indefinitamente.
 */
export function useVaultAutoLock(open: boolean, onLock: () => void): void {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(onLock, AUTO_LOCK_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") onLock();
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, reset));
    document.addEventListener("visibilitychange", onVisibility);
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [open, onLock]);
}
