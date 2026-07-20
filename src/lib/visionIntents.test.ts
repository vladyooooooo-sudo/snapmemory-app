import { describe, expect, it } from "vitest";
import { buildVisionUserInstruction, VISION_INTENTS, VISION_OUTPUT_SCHEMA } from "./visionIntents";
import { sanitizeVisionResult } from "./vision";

describe("intenti di visione", () => {
  it("ogni intento ha chip e istruzione", () => {
    for (const meta of Object.values(VISION_INTENTS)) {
      expect(meta.chip.length).toBeGreaterThan(0);
      expect(meta.instruction.length).toBeGreaterThan(20);
    }
  });

  it("l'intento custom usa la domanda dell'utente", () => {
    expect(buildVisionUserInstruction("custom", "Che pianta è?")).toContain("Che pianta è?");
  });

  it("custom senza domanda ricade sulla descrizione della scena", () => {
    expect(buildVisionUserInstruction("custom", "")).toBe(VISION_INTENTS.scena.instruction);
  });

  it("lo schema è strict (additionalProperties false, tutti i campi required)", () => {
    expect(VISION_OUTPUT_SCHEMA.additionalProperties).toBe(false);
    expect(VISION_OUTPUT_SCHEMA.required).toEqual(
      expect.arrayContaining(["title", "description", "category", "tags", "amount", "expiry"])
    );
  });
});

describe("sanitizeVisionResult", () => {
  it("normalizza categorie sconosciute e valori sporchi", () => {
    const r = sanitizeVisionResult({
      title: "Ok",
      description: "desc",
      category: "hacker" as never,
      tags: ["A", "B", "C", "D", "E", "F", "G"],
      amount: Number.NaN,
      expiry: "domani",
    });
    expect(r.category).toBe("idea");
    expect(r.tags).toHaveLength(5);
    expect(r.amount).toBeNull();
    expect(r.expiry).toBeNull();
  });

  it("conserva i valori validi", () => {
    const r = sanitizeVisionResult({
      title: "Scontrino",
      description: "Cena",
      category: "spesa",
      tags: ["cena"],
      amount: 42.5,
      expiry: "2027-01-01",
    });
    expect(r.amount).toBe(42.5);
    expect(r.expiry).toBe("2027-01-01");
  });
});
