import { describe, expect, it, vi, afterEach } from "vitest";
import { isThisMonth, dayKey, isWithinDays } from "./date";

describe("isThisMonth", () => {
  afterEach(() => vi.useRealTimers());

  it("bug corretto: un ricordo dello stesso mese ma dell'anno scorso NON è 'di questo mese'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T10:00:00"));
    const lastYearSameMonth = new Date("2025-07-05T10:00:00");
    expect(isThisMonth(lastYearSameMonth)).toBe(false);
  });

  it("un ricordo dello stesso mese e anno è 'di questo mese'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T10:00:00"));
    const sameMonth = new Date("2026-07-05T10:00:00");
    expect(isThisMonth(sameMonth)).toBe(true);
  });

  it("un ricordo di un mese diverso non è 'di questo mese'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T10:00:00"));
    expect(isThisMonth(new Date("2026-06-20T10:00:00"))).toBe(false);
  });
});

describe("dayKey", () => {
  it("produce la stessa chiave per due istanti nello stesso giorno", () => {
    const a = new Date("2026-07-20T00:05:00");
    const b = new Date("2026-07-20T23:55:00");
    expect(dayKey(a)).toBe(dayKey(b));
  });

  it("produce chiavi diverse per giorni diversi", () => {
    expect(dayKey(new Date("2026-07-20T12:00:00"))).not.toBe(dayKey(new Date("2026-07-21T12:00:00")));
  });
});

describe("isWithinDays", () => {
  afterEach(() => vi.useRealTimers());

  it("è true entro la finestra e false fuori", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T12:00:00"));
    expect(isWithinDays(new Date("2026-07-15T12:00:00"), 30)).toBe(true);
    expect(isWithinDays(new Date("2026-05-01T12:00:00"), 30)).toBe(false);
  });
});
