import type { VisionIntent } from "../types";

export interface VisionIntentMeta {
  /** Etichetta del chip nella UI di cattura. */
  chip: string;
  /** Istruzione specifica passata al modello per questo intento. */
  instruction: string;
}

/**
 * Intenti di cattura: un tap dice a Iris cosa guardare nella foto.
 * Condiviso tra client (chip) e funzione serverless (prompt).
 */
export const VISION_INTENTS: Record<Exclude<VisionIntent, "custom">, VisionIntentMeta> = {
  scena: {
    chip: "Cosa c'è nella foto?",
    instruction:
      "Descrivi cosa c'è nella foto: gli oggetti principali, dove si trovano, i dettagli utili per ritrovarli o ricordarli. Sii concreto, niente poesia.",
  },
  testo: {
    chip: "Leggi il testo",
    instruction:
      "Leggi tutto il testo presente nella foto (scontrino, documento, cartello, biglietto) e trascrivilo fedelmente. Se è uno scontrino, individua il totale.",
  },
  posizione: {
    chip: "Dove l'ho messo",
    instruction:
      "L'utente sta fotografando DOVE ripone un oggetto per ritrovarlo in futuro. Identifica l'oggetto e descrivi con precisione il posto (scatola, cassetto, scaffale, stanza, punti di riferimento visibili). Categoria: posizione.",
  },
  scadenza: {
    chip: "Scadenza",
    instruction:
      "Trova la data di scadenza nella foto (alimento, farmaco, garanzia, documento, assicurazione). Riporta il prodotto e la data esatta in formato YYYY-MM-DD nel campo expiry. Se l'anno non è visibile, deducilo dal contesto (mai nel passato).",
  },
};

export const VISION_INTENT_IDS = Object.keys(VISION_INTENTS) as Exclude<VisionIntent, "custom">[];

/** Prompt di sistema per l'analisi: identico lato server, testabile lato client. */
export function buildVisionSystemPrompt(): string {
  return [
    "Sei Iris, l'assistente visiva di SnapMemory: guardi una foto e la trasformi in un ricordo strutturato, in italiano, con tono caldo ed essenziale.",
    "Rispondi SOLO con il JSON richiesto.",
    "Regole per i campi:",
    "- title: massimo 6 parole, concreto (es. «Figurine nel cassetto cucina»).",
    "- description: 1-3 frasi utili per ritrovare o ricordare; se c'è testo leggibile importante, includilo.",
    "- category: spesa (scontrini/pagamenti), luogo (posti/parcheggi), evento (appuntamenti/biglietti), segreto (password/codici/documenti sensibili), idea (pensieri/da provare), persona (persone), posizione (dove è riposto un oggetto).",
    "- tags: 1-3 parole chiave minuscole utili per la ricerca.",
    "- amount: importo in euro se presente (es. totale scontrino), altrimenti null.",
    "- expiry: data di scadenza YYYY-MM-DD se presente o richiesta, altrimenti null.",
    "Non inventare dati che non vedi.",
  ].join("\n");
}

export function buildVisionUserInstruction(intent: VisionIntent, customQuestion?: string): string {
  if (intent === "custom") {
    const q = (customQuestion ?? "").trim();
    return q
      ? `Domanda dell'utente su questa foto: «${q}». Rispondi nella description e compila gli altri campi di conseguenza.`
      : VISION_INTENTS.scena.instruction;
  }
  return VISION_INTENTS[intent].instruction;
}

/** JSON Schema per l'output strutturato dell'API. */
export const VISION_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Titolo breve del ricordo, max 6 parole" },
    description: { type: "string", description: "Descrizione utile di 1-3 frasi" },
    category: {
      type: "string",
      enum: ["spesa", "luogo", "evento", "segreto", "idea", "persona", "posizione"],
    },
    tags: { type: "array", items: { type: "string" } },
    amount: { type: ["number", "null"], description: "Importo in euro, o null" },
    expiry: { type: ["string", "null"], description: "Scadenza YYYY-MM-DD, o null" },
  },
  required: ["title", "description", "category", "tags", "amount", "expiry"],
  additionalProperties: false,
} as const;
