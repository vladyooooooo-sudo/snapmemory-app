import type { CategoryId } from "../types";
import { parseExpiryDate } from "./expiry";

export interface ParsedCapture {
  cat: CategoryId;
  title: string;
  summary: string;
  ocr: string;
  tags: string[];
  amount?: number;
  locked: boolean;
  expiry?: string;
}

/**
 * "Visione" euristica di Iris: legge il testo (scritto a mano o letto via
 * OCR dalla foto) e ne deduce categoria, titolo, tag e importo. Resta il
 * fallback di parsing quando l'OCR reale è disponibile ma incerto, e
 * l'unico motore quando l'utente scrive a mano cosa vede.
 */
export function parseCapture(text: string): ParsedCapture {
  const t = text.trim();
  const low = t.toLowerCase();
  const amt = low.match(/(\d+[.,]\d{2})\s*(?:€|eur)?|(?:€|eur|totale)\s*(\d+[.,]?\d*)/);
  const amount = amt ? parseFloat((amt[1] || amt[2]).replace(",", ".")) : undefined;

  let cat: CategoryId = "idea";
  if (/wifi|wi-fi|password|pwd|pin |codice|iban|carta d'identità|tessera/.test(low)) cat = "segreto";
  else if (/ho messo|ho riposto|ho lasciato|riposto (in|nel|nella)|scatola|cassetto|cantina|soffitta|ripostiglio|armadio/.test(low)) cat = "posizione";
  else if (amount !== undefined || /scontrino|pagato|spesa|ricevuta|scad\.|scadenza|da consumar|best before/.test(low)) cat = "spesa";
  else if (/parchegg|posto |livello|settore|via |viale |piazza|binario/.test(low)) cat = "luogo";
  else if (
    /ore \d|alle \d|appuntamento|visita|concerto|biglietto|domani|luned|marted|mercoled|gioved|venerd|sabato|domenica|\d{1,2}\/\d{1,2}/.test(low)
  )
    cat = "evento";
  else if (
    /vicin|amic|collega|dott|zia|zio|nonn|mamma|papà|signor/.test(low) ||
    /^[A-ZÀ-Ù][a-zà-ù]+\s*(,|·|-)/.test(t)
  )
    cat = "persona";

  const words = t.split(/\s+/);
  const rawTitle = words.slice(0, 5).join(" ").replace(/[.,·]$/, "") || "Ricordo";
  const title = rawTitle[0].toUpperCase() + rawTitle.slice(1);
  const tags = [...new Set(low.split(/[^a-zà-ù0-9]+/).filter((w) => w.length > 4).slice(0, 3))];
  const expiry = parseExpiryDate(t) ?? undefined;

  return { cat, title, summary: t, ocr: t, tags, amount, locked: cat === "segreto", expiry };
}
