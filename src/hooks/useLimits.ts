import { useMemo } from "react";
import { LIMITS } from "../constants/LIMITS";
import type { LimitedFeature, LimitResult, Plan } from "../types";

function nextResetAt(period: "day" | "week" | undefined, now: Date): Date | null {
  if (!period) return null;
  const d = new Date(now);
  if (period === "day") {
    d.setHours(24, 0, 0, 0);
    return d;
  }
  // week: prossimo lunedì 00:00
  const day = d.getDay(); // 0 = domenica
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Dato l'uso corrente di una feature limitata (quante volte è già stata
 * usata nel periodo, o quanti elementi esistono già), restituisce se è
 * ancora consentita, quante ne restano e quando si resetta il limite.
 * `null` come limite/resetAt significa "illimitato".
 */
export function useLimits(feature: LimitedFeature, currentUsageCount: number, plan: Plan): LimitResult {
  return useMemo(() => {
    const config = LIMITS[feature];
    const limit = plan === "pro" ? config.pro : config.free;

    if (limit === null) {
      return { allowed: true, remaining: Infinity, limit: null, resetAt: null };
    }

    const remaining = Math.max(0, limit - currentUsageCount);
    return {
      allowed: currentUsageCount < limit,
      remaining,
      limit,
      resetAt: nextResetAt(config.period, new Date()),
    };
  }, [feature, currentUsageCount, plan]);
}
