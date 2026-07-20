import { useEffect, type RefObject } from "react";

/** Chiude un pannello (es. menu •••) al click/tap fuori dal suo elemento. */
export function useOnClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active = true): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: PointerEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [ref, onOutside, active]);
}
