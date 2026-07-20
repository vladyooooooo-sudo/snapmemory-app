import Anthropic from "@anthropic-ai/sdk";
import {
  buildVisionSystemPrompt,
  buildVisionUserInstruction,
  VISION_OUTPUT_SCHEMA,
} from "../src/lib/visionIntents";
import type { VisionIntent, VisionResult } from "../src/types";

export const config = { maxDuration: 60 };

interface VisionRequestBody {
  image: string; // base64 JPEG, senza prefisso data:
  intent: VisionIntent;
  question?: string;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // ~8MB decodificati

/**
 * Analisi visiva di uno scatto: la foto arriva qui, va a Claude con un
 * prompt specifico per l'intento scelto, e torna un JSON strutturato.
 * La foto è usa-e-getta: non viene salvata da nessuna parte.
 * La chiave API vive solo nella variabile d'ambiente ANTHROPIC_API_KEY.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    // Chiave non configurata su Vercel: il client ricade sull'OCR locale.
    res.status(503).json({ error: "vision_unavailable" });
    return;
  }

  const body = req.body as VisionRequestBody | undefined;
  if (!body?.image || typeof body.image !== "string") {
    res.status(400).json({ error: "missing_image" });
    return;
  }
  if (body.image.length * 0.75 > MAX_IMAGE_BYTES) {
    res.status(413).json({ error: "image_too_large" });
    return;
  }
  const intent: VisionIntent = body.intent ?? "scena";

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: VISION_OUTPUT_SCHEMA as any },
      },
      system: buildVisionSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: body.image },
            },
            { type: "text", text: buildVisionUserInstruction(intent, body.question) },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      res.status(422).json({ error: "refused" });
      return;
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      res.status(502).json({ error: "empty_response" });
      return;
    }

    const parsed = JSON.parse(textBlock.text) as VisionResult;
    res.status(200).json(parsed);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: "rate_limited" });
    } else if (err instanceof Anthropic.APIError) {
      res.status(502).json({ error: "api_error" });
    } else {
      res.status(502).json({ error: "vision_failed" });
    }
  }
}
