import type { Memory } from "../types";

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fmtDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function fmtDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fmtDate(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/**
 * Genera un file .ics per un ricordo-evento, apribile con un tap in
 * Google/Apple Calendar. `eventDate` è la data scelta/confermata
 * dall'utente (YYYY-MM-DD) con orario opzionale (HH:mm).
 */
export function buildIcs(memory: Memory, eventDate: string, eventTime?: string): string {
  const uid = `${memory.id}@snapmemory`;
  const stamp = fmtDateTime(new Date());
  let dtLines: string[];
  if (eventTime) {
    const start = new Date(`${eventDate}T${eventTime}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    dtLines = [`DTSTART:${fmtDateTime(start)}`, `DTEND:${fmtDateTime(end)}`];
  } else {
    const day = new Date(`${eventDate}T00:00:00`);
    const next = new Date(day.getTime() + 86_400_000);
    dtLines = [`DTSTART;VALUE=DATE:${fmtDate(day)}`, `DTEND;VALUE=DATE:${fmtDate(next)}`];
  }
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SnapMemory//Iris//IT",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    ...dtLines,
    `SUMMARY:${escapeIcs(memory.title)}`,
    `DESCRIPTION:${escapeIcs(memory.summary)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(memory: Memory, eventDate: string, eventTime?: string): void {
  const blob = new Blob([buildIcs(memory, eventDate, eventTime)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${memory.title.replace(/[^\wà-ù -]/gi, "").slice(0, 40) || "evento"}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
