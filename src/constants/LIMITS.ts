import type { LimitedFeature } from "../types";

/**
 * Configurazione unica dei limiti Free/Pro.
 *
 * Filosofia: il piano Free è "vero", non una demo — nessuna funzione è
 * nascosta o disattivata, ogni feature limitata resta comunque utilizzabile
 * ogni giorno. Il Pro rimuove i limiti e aggiunge qualche beneficio extra
 * (storico completo, personalizzazione, backup automatico).
 *
 * `limit: null` significa "illimitato" per quel piano.
 * `period` determina quando il contatore si azzera: "day" | "week".
 *
 * Tarare i numeri: modifica solo i valori qui sotto, la UI (badge
 * "3 su 5 usate oggi", modale di upgrade) si aggiorna da sola tramite
 * l'hook useLimits().
 */
export interface FeatureLimitConfig {
  /** Etichetta leggibile mostrata nei modali/badge. */
  label: string;
  /** Limite per piano; null = nessun limite. */
  free: number | null;
  pro: number | null;
  /** Periodo di reset del contatore (solo per feature con contatore). */
  period?: "day" | "week";
}

export const LIMITS: Record<LimitedFeature, FeatureLimitConfig> = {
  // Ricordi salvati: Free 5 al giorno / Pro illimitati.
  memorie: { label: "Ricordi salvati oggi", free: 5, pro: null, period: "day" },

  // Widget in dashboard: Free fino a 6 / Pro fino a 12.
  widget: { label: "Widget in dashboard", free: 6, pro: 12 },

  // Ricerca conversazionale con Iris: Free 10 domande al giorno / Pro illimitate.
  domandeIris: { label: "Domande a Iris oggi", free: 10, pro: null, period: "day" },

  // Cassaforte (ricordi riservati): Free fino a 10 elementi / Pro illimitati.
  vault: { label: "Ricordi riservati", free: 10, pro: null },

  // Export/backup JSON: Free 1 export a settimana / Pro export illimitati + backup automatico.
  export: { label: "Export questa settimana", free: 1, pro: null, period: "week" },

  // Cronologia "Un anno fa": Free ultimi 12 mesi / Pro storico completo.
  annofaStorico: { label: "Storico 'Un anno fa' (mesi)", free: 12, pro: null },

  // Tag emotivo mensile (widget Umore): Free ultimi 30 giorni / Pro anno intero con grafico.
  umoreStorico: { label: "Storico Umore (giorni)", free: 30, pro: 365 },

  // Personalizzazione: Free accent fisso (ambra) / Pro sceglie tra 5 accent colors.
  accent: { label: "Colori accento disponibili", free: 1, pro: 5 },
};

/**
 * Funzioni SEMPRE disponibili in entrambi i piani, senza limiti:
 * onboarding, streak, PIN, fotocamera/OCR, modifica/elimina ricordi,
 * correzione manuale delle proposte di Iris.
 * Non compaiono qui perché non sono mai limitate: nessuna configurazione
 * necessaria.
 */
