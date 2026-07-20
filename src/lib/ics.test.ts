import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";
import type { Memory } from "../types";

const memory: Memory = {
  id: "abc",
  cat: "evento",
  title: "Concerto, sabato",
  summary: "Biglietto fila C; posto 12",
  ocr: "",
  tags: [],
  locked: false,
  date: "2026-07-20T10:00:00.000Z",
  mood: null,
};

describe("buildIcs", () => {
  it("genera un evento con orario di un'ora", () => {
    const ics = buildIcs(memory, "2026-08-01", "21:00");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20260801T210000");
    expect(ics).toContain("DTEND:20260801T220000");
    expect(ics).toContain("SUMMARY:Concerto\\, sabato");
    expect(ics).toContain("DESCRIPTION:Biglietto fila C\\; posto 12");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("senza orario genera un evento di tutto il giorno", () => {
    const ics = buildIcs(memory, "2026-08-01");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260801");
    expect(ics).toContain("DTEND;VALUE=DATE:20260802");
  });
});
