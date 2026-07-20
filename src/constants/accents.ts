import type { AccentColor } from "../types";

/** Free ha solo "amber" (identità visiva originale). Pro sblocca gli altri. */
export const ACCENTS: AccentColor[] = [
  { id: "amber", label: "Ambra", hex: "#fbbf24" },
  { id: "rose", label: "Rosa antico", hex: "#fb7185" },
  { id: "emerald", label: "Smeraldo", hex: "#34d399" },
  { id: "sky", label: "Cielo", hex: "#38bdf8" },
  { id: "violet", label: "Violetto", hex: "#a78bfa" },
];

export const DEFAULT_ACCENT = "amber";

export const getAccent = (id: string): AccentColor =>
  ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
