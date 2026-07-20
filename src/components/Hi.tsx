import type { ReactNode } from "react";

interface HiProps {
  text: string;
  words?: string[];
}

/** Evidenzia le parole di ricerca all'interno del testo. */
export function Hi({ text, words }: HiProps): ReactNode {
  if (!words?.length) return text;
  const rx = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(rx).map((part, i) =>
    words.some((w) => part.toLowerCase() === w.toLowerCase()) ? (
      <mark key={i} className="rounded bg-amber-300/25 px-0.5 text-amber-200">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
