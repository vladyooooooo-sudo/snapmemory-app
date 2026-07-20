import type { IrisMood } from "../types";

export const MOOD_EMOJI = ["☀️", "😐", "☁️", "🔥", "❤️"] as const;

export const GLOW: Record<IrisMood, string> = {
  idle: "rgba(148,163,184,.22)",
  working: "rgba(251,191,36,.55)",
  search: "rgba(251,191,36,.45)",
  happy: "rgba(52,211,153,.55)",
  alert: "rgba(251,113,133,.55)",
  sad: "rgba(148,163,184,.15)",
  nostalgia: "rgba(253,186,116,.40)",
  shutter: "rgba(251,191,36,.95)",
};

export const SMILE: Record<IrisMood, string> = {
  idle: "M37 67 Q50 73 63 67",
  working: "M39 68 Q50 71 61 68",
  search: "M39 68 Q50 71 61 68",
  happy: "M35 66 Q50 78 65 66",
  alert: "M39 70 L61 70",
  sad: "M38 72 Q50 66 62 72",
  nostalgia: "M36 67 Q50 75 64 67",
  shutter: "M37 67 Q50 73 63 67",
};
