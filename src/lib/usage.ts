import type { UsageCounter, UsageState } from "../types";
import { dayKey } from "./date";

function startOfWeekKey(d: Date): string {
  const copy = new Date(d);
  const day = copy.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  copy.setHours(0, 0, 0, 0);
  return copy.toDateString();
}

function periodKey(period: "day" | "week", now: Date): string {
  return period === "day" ? dayKey(now) : startOfWeekKey(now);
}

export function emptyCounter(): UsageCounter {
  return { count: 0, periodStart: "" };
}

export function defaultUsage(): UsageState {
  return {
    domandeIrisPerGiorno: emptyCounter(),
    exportPerSettimana: emptyCounter(),
    upgradePromptedOn: null,
  };
}

/** Conteggio corrente del periodo (0 se il periodo precedente è scaduto). */
export function currentCount(counter: UsageCounter, period: "day" | "week", now: Date = new Date()): number {
  return counter.periodStart === periodKey(period, now) ? counter.count : 0;
}

/** Incrementa il contatore, azzerandolo se si è entrati in un nuovo periodo. */
export function bump(counter: UsageCounter, period: "day" | "week", now: Date = new Date()): UsageCounter {
  const key = periodKey(period, now);
  const count = counter.periodStart === key ? counter.count + 1 : 1;
  return { count, periodStart: key };
}
