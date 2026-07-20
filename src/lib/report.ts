import { CATS } from "../constants/categories";
import { MOOD_EMOJI } from "../constants/moods";
import { isThisMonth } from "./date";
import type { CategoryId, Memory } from "../types";

export interface MonthlyReport {
  monthLabel: string;
  totalMemories: number;
  totalSpent: number;
  spentByCategory: { cat: CategoryId; label: string; total: number }[];
  prevailingMood: number | null; // indice MOOD_EMOJI
  moodCounts: number[];
  peopleCount: number;
  placesCount: number;
  bestMemory: Memory | null; // il ricordo col mood più alto del mese
}

/** Compone il report del mese corrente sui soli dati veri dell'utente. */
export function buildMonthlyReport(items: Memory[], now: Date = new Date()): MonthlyReport {
  const monthItems = items.filter((m) => isThisMonth(m.date, now));
  const spese = monthItems.filter((m) => m.amount != null);

  const byCat = new Map<CategoryId, number>();
  for (const m of spese) byCat.set(m.cat, (byCat.get(m.cat) ?? 0) + (m.amount ?? 0));

  const moodCounts = MOOD_EMOJI.map((_, i) => monthItems.filter((m) => m.mood === i).length);
  const maxMood = Math.max(...moodCounts);
  const prevailingMood = maxMood > 0 ? moodCounts.indexOf(maxMood) : null;

  const withMood = monthItems.filter((m) => m.mood != null);
  const bestMemory = withMood.length
    ? withMood.reduce((a, b) => ((b.mood ?? 0) > (a.mood ?? 0) ? b : a))
    : monthItems[0] ?? null;

  return {
    monthLabel: now.toLocaleDateString("it-IT", { month: "long", year: "numeric" }),
    totalMemories: monthItems.length,
    totalSpent: spese.reduce((a, m) => a + (m.amount ?? 0), 0),
    spentByCategory: [...byCat.entries()]
      .map(([cat, total]) => ({ cat, label: CATS[cat].label, total }))
      .sort((a, b) => b.total - a.total),
    prevailingMood,
    moodCounts,
    peopleCount: monthItems.filter((m) => m.cat === "persona").length,
    placesCount: monthItems.filter((m) => m.cat === "luogo").length,
    bestMemory,
  };
}

/**
 * Disegna il report su canvas (1080×1350, formato condivisibile sui social)
 * con i token visivi dell'app: fondo #08080A, accent ambra, tanta aria.
 */
export function renderReportToCanvas(report: MonthlyReport, nick: string): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const amber = "#fbbf24";

  ctx.fillStyle = "#08080A";
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.7);
  grad.addColorStop(0, "rgba(251,191,36,.10)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const font = (size: number, weight = 400) => `${weight} ${size}px 'Plus Jakarta Sans', system-ui, sans-serif`;

  ctx.fillStyle = "rgba(251,191,36,.85)";
  ctx.font = font(30, 600);
  ctx.fillText(report.monthLabel.toUpperCase(), 80, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = font(64, 700);
  ctx.fillText(`Il mese di ${nick}`, 80, 200);

  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.font = font(30);
  ctx.fillText("raccontato da Iris, che c'era.", 80, 250);

  // Stat principali
  const stats: [string, string][] = [
    [String(report.totalMemories), report.totalMemories === 1 ? "ricordo salvato" : "ricordi salvati"],
    [`${report.totalSpent.toFixed(2)} €`, "spesi e tracciati"],
    [String(report.peopleCount), report.peopleCount === 1 ? "persona incontrata" : "persone incontrate"],
    [String(report.placesCount), report.placesCount === 1 ? "luogo salvato" : "luoghi salvati"],
  ];
  stats.forEach(([value, label], i) => {
    const x = 80 + (i % 2) * 480;
    const y = 380 + Math.floor(i / 2) * 200;
    ctx.fillStyle = amber;
    ctx.font = font(72, 700);
    ctx.fillText(value, x, y);
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = font(30);
    ctx.fillText(label, x, y + 45);
  });

  // Barre spese per categoria
  let y = 880;
  if (report.spentByCategory.length) {
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = font(26, 600);
    ctx.fillText("DOVE SONO ANDATI", 80, y - 30);
    const maxTotal = report.spentByCategory[0].total || 1;
    for (const row of report.spentByCategory.slice(0, 4)) {
      const barW = Math.max(24, (row.total / maxTotal) * 640);
      ctx.fillStyle = "rgba(251,191,36,.35)";
      ctx.beginPath();
      ctx.roundRect(80, y, barW, 44, 10);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = font(28, 600);
      ctx.fillText(row.label, 96, y + 31);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = font(28);
      ctx.fillText(`${row.total.toFixed(2)} €`, 80 + 660, y + 31);
      y += 70;
    }
  }

  // Umore prevalente
  if (report.prevailingMood != null) {
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = font(26, 600);
    ctx.fillText("UMORE DEL MESE", 80, 1195);
    ctx.font = font(84);
    ctx.fillText(MOOD_EMOJI[report.prevailingMood], 80, 1290);
  }

  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.font = font(26);
  ctx.textAlign = "right";
  ctx.fillText("SnapMemory · con Iris", W - 80, H - 60);
  ctx.textAlign = "left";

  return canvas;
}

export async function shareOrDownloadReport(canvas: HTMLCanvasElement, monthLabel: string): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const file = new File([blob], `snapmemory-${monthLabel.replace(/\s+/g, "-")}.png`, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `Il mio mese con SnapMemory` });
      return;
    } catch {
      // condivisione annullata: si scarica
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}
