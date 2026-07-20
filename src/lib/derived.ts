import { isThisMonth, isWithinDays, daysAgo } from "./date";
import { LIMITS } from "../constants/LIMITS";
import type { Memory, Plan } from "../types";

/**
 * Bug corretto: "Speso questo mese" e "Umore del mese" confrontavano solo
 * getMonth(), ignorando l'anno (un ricordo di luglio dell'anno scorso
 * veniva contato come "di questo mese"). isThisMonth() confronta anche
 * l'anno.
 */
export function monthlyExpenses(items: Memory[], now: Date = new Date()) {
  const monthSpese = items.filter((m) => m.amount != null && isThisMonth(m.date, now));
  const totMese = monthSpese.reduce((a, m) => a + (m.amount ?? 0), 0);
  return { monthSpese, totMese };
}

export function monthlyMoods(items: Memory[], plan: Plan) {
  const days = plan === "pro" ? LIMITS.umoreStorico.pro! : LIMITS.umoreStorico.free!;
  return items.filter((m) => m.mood != null && isWithinDays(m.date, days));
}

/**
 * "Un anno fa": Free guarda solo l'anniversario a un anno (com'era
 * nell'originale); Pro guarda anche i 2, 3, 4 e 5 anni fa, mostrando il
 * più recente che cade in una finestra di qualche giorno da "oggi".
 */
export function anniversaryMemories(items: Memory[], plan: Plan): Memory[] {
  const yearsBack = plan === "pro" ? [1, 2, 3, 4, 5] : [1];
  return items.filter((m) => {
    const d = daysAgo(m.date);
    return yearsBack.some((y) => d > y * 365 - 5 && d < y * 365 + 5);
  });
}

export function peopleMemories(items: Memory[]): Memory[] {
  return items.filter((m) => m.cat === "persona");
}

export function pendingIdeas(items: Memory[]): Memory[] {
  return items.filter((m) => m.cat === "idea" && !m.tags.includes("diario"));
}

export function upcomingEvents(items: Memory[]): Memory[] {
  return items.filter((m) => m.cat === "evento");
}
