import type { PersistedState } from "../types";

const KEY = "snapmemory:v1";

/**
 * Adapter di persistenza reale su localStorage.
 *
 * Bug corretto rispetto al prototipo: il commento originale suggeriva
 * `localStorage.getItem(...)` senza JSON.parse, che avrebbe restituito una
 * stringa invece di un oggetto e rotto la persistenza in silenzio. Qui si
 * usa sempre JSON.parse/JSON.stringify, con fallback a stato vuoto (mai
 * crash) se i dati sono corrotti o assenti, e `removeItem` per il reset
 * invece di salvare `null`.
 */
export const store = {
  load(): PersistedState | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return null;
      return parsed as PersistedState;
    } catch {
      // Dati corrotti (JSON invalido, storage non disponibile, quota...):
      // meglio ripartire da uno stato vuoto che far crashare l'app.
      return null;
    }
  },

  save(data: PersistedState): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Quota storage piena o storage non disponibile: salvataggio saltato,
      // l'app resta comunque utilizzabile in memoria per la sessione corrente.
    }
  },

  reset(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignorato: nessuno stato da rimuovere o storage non disponibile.
    }
  },
};

export function exportToJSON(data: PersistedState): string {
  return JSON.stringify(data, null, 2);
}

export function importFromJSON(raw: string): PersistedState | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    if (!("profile" in parsed) || !("items" in parsed)) return null;
    return parsed as PersistedState;
  } catch {
    return null;
  }
}
