import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_ACCENT, getAccent } from "../constants/accents";

const AccentContext = createContext<string>(getAccent(DEFAULT_ACCENT).hex);

export function AccentProvider({ accentId, children }: { accentId: string; children: ReactNode }) {
  return <AccentContext.Provider value={getAccent(accentId).hex}>{children}</AccentContext.Provider>;
}

export function useAccent(): string {
  return useContext(AccentContext);
}
