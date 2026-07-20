import { describe, expect, it } from "vitest";
import { parseExpiryDate, upcomingExpiries, expiryLabel } from "./expiry";
import type { Memory } from "../types";

const NOW = new Date("2026-07-20T12:00:00");

describe("parseExpiryDate", () => {
  it("riconosce scad. DD/MM/YYYY", () => {
    expect(parseExpiryDate("Latte, scad. 12/05/2027", NOW)).toBe("2027-05-12");
  });

  it("riconosce l'anno a due cifre", () => {
    expect(parseExpiryDate("scadenza 03/09/26", NOW)).toBe("2026-09-03");
  });

  it("riconosce «entro il 3 marzo 2027»", () => {
    expect(parseExpiryDate("da consumarsi entro il 3 marzo 2027", NOW)).toBe("2027-03-03");
  });

  it("senza anno usa il prossimo possibile (mai nel passato)", () => {
    // gennaio è già passato nel 2026 → 2027
    expect(parseExpiryDate("scade il 5 gennaio", NOW)).toBe("2027-01-05");
    // dicembre deve ancora arrivare → 2026
    expect(parseExpiryDate("scade il 5 dicembre", NOW)).toBe("2026-12-05");
  });

  it("MM/YYYY senza giorno → ultimo giorno del mese", () => {
    expect(parseExpiryDate("best before 02/2027", NOW)).toBe("2027-02-28");
  });

  it("ignora date senza contesto di scadenza", () => {
    expect(parseExpiryDate("Cena del 12/05/2027 con Marco", NOW)).toBeNull();
  });

  it("YYYY-MM-DD esplicito", () => {
    expect(parseExpiryDate("exp 2026-11-30", NOW)).toBe("2026-11-30");
  });
});

function mem(expiry: string | undefined, id = "x"): Memory {
  return { id, cat: "spesa", title: id, summary: "", ocr: "", tags: [], locked: false, date: NOW.toISOString(), mood: null, expiry };
}

describe("upcomingExpiries", () => {
  it("ordina per urgenza e ignora le scadenze lontane", () => {
    const items = [mem("2026-09-01", "lontano"), mem("2026-07-21", "domani"), mem("2026-07-25", "presto"), mem(undefined, "senza")];
    const res = upcomingExpiries(items, 30, NOW);
    expect(res.map((x) => x.memory.id)).toEqual(["domani", "presto"]);
    expect(res[0].daysLeft).toBe(1);
  });

  it("include gli appena scaduti", () => {
    const res = upcomingExpiries([mem("2026-07-18", "scaduto")], 30, NOW);
    expect(res[0].daysLeft).toBe(-2);
    expect(expiryLabel(res[0].daysLeft)).toContain("scaduto");
  });
});

describe("expiryLabel", () => {
  it("etichette leggibili", () => {
    expect(expiryLabel(0)).toBe("scade oggi");
    expect(expiryLabel(1)).toBe("scade domani");
    expect(expiryLabel(5)).toBe("tra 5 giorni");
  });
});
