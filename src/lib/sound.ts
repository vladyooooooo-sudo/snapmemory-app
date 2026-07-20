let ctx: AudioContext | undefined;

type BeepKind = "shutter" | "pop";

/** Suoni WebAudio generati al volo (nessun asset), off di default. */
export function beep(kind: BeepKind): void {
  try {
    ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime;
    if (kind === "shutter") {
      o.type = "square";
      o.frequency.setValueAtTime(1200, t);
      o.frequency.exponentialRampToValueAtTime(200, t + 0.07);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      o.start(t);
      o.stop(t + 0.1);
    } else {
      o.type = "sine";
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(880, t + 0.12);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(t);
      o.stop(t + 0.2);
    }
  } catch {
    // audio non disponibile: silenzio
  }
}
