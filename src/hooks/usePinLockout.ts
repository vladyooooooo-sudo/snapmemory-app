import { useCallback, useEffect, useState } from "react";

const KEY = "snapmemory:pinlock";

interface LockState {
  attempts: number;
  lockedUntil: number | null; // epoch ms
}

function load(): LockState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    const parsed = JSON.parse(raw);
    return { attempts: parsed.attempts ?? 0, lockedUntil: parsed.lockedUntil ?? null };
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function persist(state: LockState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage non disponibile: il lockout resta solo per la sessione corrente
  }
}

/** Durata del blocco in ms, cresce con il numero di tentativi falliti. */
function backoffFor(attempts: number): number {
  if (attempts < 3) return 0;
  if (attempts < 5) return 30_000;
  if (attempts < 7) return 120_000;
  return 600_000;
}

/**
 * Rate limiting progressivo sui tentativi di PIN: nessun limite sui primi
 * tentativi, poi un blocco crescente (30s → 2min → 10min) per scoraggiare
 * il brute force senza penalizzare una singola svista.
 */
export function usePinLockout() {
  const [state, setState] = useState<LockState>(load);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!state.lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [state.lockedUntil]);

  const lockedMsRemaining = state.lockedUntil ? Math.max(0, state.lockedUntil - now) : 0;
  const isLocked = lockedMsRemaining > 0;

  const registerFailure = useCallback(() => {
    setState((s) => {
      const attempts = s.attempts + 1;
      const wait = backoffFor(attempts);
      const next: LockState = { attempts, lockedUntil: wait ? Date.now() + wait : null };
      persist(next);
      return next;
    });
  }, []);

  const registerSuccess = useCallback(() => {
    const next: LockState = { attempts: 0, lockedUntil: null };
    setState(next);
    persist(next);
  }, []);

  return { isLocked, lockedSeconds: Math.ceil(lockedMsRemaining / 1000), registerFailure, registerSuccess };
}
