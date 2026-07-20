import type { Memory } from "../types";

const MONTHS: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Euristica di fallback per estrarre una data di scadenza dal testo
 * (quando l'analisi AI non è disponibile). Riconosce:
 *   «scad. 12/05/2027», «scadenza: 3 marzo 2026», «exp 2026-03-01»,
 *   «da consumarsi entro il 05/2026» (giorno mancante → fine mese).
 */
export function parseExpiryDate(text: string, now: Date = new Date()): string | null {
  const low = text.toLowerCase();
  if (!/scad|entro|exp|best before|da consumar/.test(low)) return null;

  // YYYY-MM-DD
  let m = low.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return toIso(+m[1], +m[2], +m[3]);

  // DD/MM/YYYY o DD/MM/YY o DD-MM-YYYY
  m = low.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return toIso(y, +m[2], +m[1]);
  }

  // «3 marzo 2026» o «3 marzo» (anno implicito: il prossimo possibile)
  m = low.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?/);
  if (m) {
    const month = MONTHS[m[2]];
    let year = m[3] ? +m[3] : now.getFullYear();
    if (!m[3]) {
      const candidate = new Date(year, month - 1, +m[1]);
      if (candidate < now) year += 1;
    }
    return toIso(year, month, +m[1]);
  }

  // MM/YYYY (senza giorno → ultimo giorno del mese)
  m = low.match(/(\d{1,2})[/.-](\d{4})/);
  if (m) {
    const month = +m[1];
    const year = +m[2];
    const lastDay = new Date(year, month, 0).getDate();
    return toIso(year, month, lastDay);
  }

  return null;
}

export interface ExpiringItem {
  memory: Memory;
  daysLeft: number; // negativo = già scaduto
}

/** Ricordi con scadenza nei prossimi `windowDays` giorni (o già scaduti da poco), ordinati per urgenza. */
export function upcomingExpiries(items: Memory[], windowDays = 60, now: Date = new Date()): ExpiringItem[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return items
    .filter((m) => m.expiry)
    .map((m) => {
      const d = new Date(`${m.expiry}T00:00:00`);
      const daysLeft = Math.round((d.getTime() - today.getTime()) / 86_400_000);
      return { memory: m, daysLeft };
    })
    .filter((x) => x.daysLeft <= windowDays && x.daysLeft >= -7)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Etichetta leggibile per il conto alla rovescia. */
export function expiryLabel(daysLeft: number): string {
  if (daysLeft < 0) return `scaduto da ${-daysLeft} ${-daysLeft === 1 ? "giorno" : "giorni"}`;
  if (daysLeft === 0) return "scade oggi";
  if (daysLeft === 1) return "scade domani";
  return `tra ${daysLeft} giorni`;
}
