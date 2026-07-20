import { createWorker } from "tesseract.js";

/**
 * OCR reale lato client via Tesseract.js. Se fallisce (rete assente al
 * primo download del modello, immagine illeggibile, ecc.) chi chiama deve
 * ricadere sul testo digitato a mano: l'euristica di parseCapture resta
 * l'unico motore di comprensione in quel caso.
 */
export async function recognizeText(image: Blob | HTMLCanvasElement | string): Promise<string> {
  const worker = await createWorker("ita");
  try {
    const { data } = await worker.recognize(image);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}
