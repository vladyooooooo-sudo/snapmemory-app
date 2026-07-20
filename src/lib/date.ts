export const fmt = (d: string | Date): string =>
  new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" });

export const dayKey = (d: Date | string = new Date()): string => new Date(d).toDateString();

/** Numero di giorni trascorsi tra `date` e ora (positivo se `date` è nel passato). */
export const daysAgo = (date: string | Date): number => (Date.now() - new Date(date).getTime()) / 86_400_000;

/**
 * true se `date` cade nel mese corrente, confrontando ANCHE l'anno
 * (bug corretto: la versione originale confrontava solo getMonth(),
 * per cui un ricordo di luglio dell'anno scorso veniva contato come
 * "di questo mese").
 */
export const isThisMonth = (date: string | Date, now: Date = new Date()): boolean => {
  const d = new Date(date);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

/** true se `date` cade negli ultimi `days` giorni (incluso oggi). */
export const isWithinDays = (date: string | Date, days: number): boolean => daysAgo(date) <= days;
