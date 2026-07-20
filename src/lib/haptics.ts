/** Feedback aptico leggero su mobile; no-op dove non supportato. */
export function haptic(pattern: number | number[] = 10): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // non supportato: silenzio
  }
}
