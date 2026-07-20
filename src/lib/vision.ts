import type { VisionIntent, VisionResult } from "../types";
import { CATS } from "../constants/categories";

const TIMEOUT_MS = 45_000;

/**
 * Chiede al backend l'analisi AI della foto. Lancia in caso di errore:
 * chi chiama gestisce la catena di fallback (OCR locale → testo manuale).
 */
export async function analyzePhoto(
  imageBase64: string,
  intent: VisionIntent,
  question?: string
): Promise<VisionResult> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64, intent, question }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`vision_http_${res.status}`);
    const data = (await res.json()) as VisionResult;
    return sanitizeVisionResult(data);
  } finally {
    clearTimeout(t);
  }
}

/** Difesa in profondità: mai fidarsi ciecamente della risposta di rete. */
export function sanitizeVisionResult(data: VisionResult): VisionResult {
  const category = data.category in CATS ? data.category : "idea";
  return {
    title: String(data.title ?? "Ricordo").slice(0, 120),
    description: String(data.description ?? "").slice(0, 2000),
    category,
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 5).map((t) => String(t).toLowerCase()) : [],
    amount: typeof data.amount === "number" && Number.isFinite(data.amount) ? data.amount : null,
    expiry: typeof data.expiry === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.expiry) ? data.expiry : null,
  };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
