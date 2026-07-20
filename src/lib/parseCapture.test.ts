import { describe, expect, it } from "vitest";
import { parseCapture } from "./parseCapture";

describe("parseCapture", () => {
  it("riconosce una spesa con importo in formato virgola", () => {
    const r = parseCapture("Scontrino cena, totale 42,50 €");
    expect(r.cat).toBe("spesa");
    expect(r.amount).toBeCloseTo(42.5);
    expect(r.locked).toBe(false);
  });

  it("riconosce un luogo da parole chiave di parcheggio", () => {
    const r = parseCapture("Posto 114, livello -2");
    expect(r.cat).toBe("luogo");
  });

  it("riconosce dati riservati e li marca come locked", () => {
    const r = parseCapture("Password wifi casa: fragola123");
    expect(r.cat).toBe("segreto");
    expect(r.locked).toBe(true);
  });

  it("riconosce un evento da un giorno della settimana", () => {
    const r = parseCapture("Concerto sabato alle 21");
    expect(r.cat).toBe("evento");
  });

  it("riconosce una persona da un nome proprio seguito da virgola", () => {
    const r = parseCapture("Elena, la vicina dell'interno 4");
    expect(r.cat).toBe("persona");
  });

  it("usa idea come categoria di default", () => {
    const r = parseCapture("Provare la ricetta con lo zafferano");
    expect(r.cat).toBe("idea");
  });

  it("capitalizza il titolo dalle prime parole", () => {
    const r = parseCapture("appunto veloce da ricordare domani");
    expect(r.title[0]).toBe(r.title[0].toUpperCase());
  });

  it("non genera un importo quando il testo non ne contiene", () => {
    const r = parseCapture("Idea per il weekend");
    expect(r.amount).toBeUndefined();
  });
});
