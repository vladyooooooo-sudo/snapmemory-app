import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Mic, Sparkles, Type as TypeIcon } from "lucide-react";
import { Iris } from "../Iris";
import { MOOD_EMOJI } from "../../constants/moods";
import { CATS } from "../../constants/categories";
import { openCamera, stopCamera, captureFrame } from "../../lib/camera";
import { recognizeText } from "../../lib/ocr";
import { analyzePhoto, blobToBase64 } from "../../lib/vision";
import { parseCapture, type ParsedCapture } from "../../lib/parseCapture";
import { VISION_INTENTS, VISION_INTENT_IDS } from "../../lib/visionIntents";
import { haptic } from "../../lib/haptics";
import { useSpeech } from "../../hooks/useSpeech";
import { Modal } from "./Modal";
import type { CategoryId, MoodIndex, VisionIntent, VisionResult } from "../../types";

interface CaptureModalProps {
  initialText?: string;
  /** false quando il limite giornaliero di analisi AI è esaurito (si usa l'OCR). */
  visionAllowed: boolean;
  visionRemaining: number;
  onClose: () => void;
  onSave: (parsed: ParsedCapture, moodIdx: MoodIndex | null) => void;
  onVisionUsed: () => void;
}

type Phase = "compose" | "analyzing" | "review";

export function CaptureModal({ initialText = "", visionAllowed, visionRemaining, onClose, onSave, onVisionUsed }: CaptureModalProps) {
  const [tab, setTab] = useState<"text" | "camera">("text");
  const [phase, setPhase] = useState<Phase>("compose");
  const [text, setText] = useState(initialText);
  const [moodIdx, setMoodIdx] = useState<MoodIndex | null>(null);
  const [intent, setIntent] = useState<VisionIntent>("scena");
  const [customQ, setCustomQ] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // review: proposta di Iris, sempre modificabile prima del salvataggio
  const [review, setReview] = useState<ParsedCapture | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const appendSpeech = useCallback((t: string) => {
    setText((prev) => (prev ? prev + " " + t : t));
  }, []);
  const speech = useSpeech(appendSpeech);

  useEffect(() => {
    if (tab !== "camera") {
      stopCamera(streamRef.current);
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    openCamera()
      .then((stream) => {
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(null);
      })
      .catch(() => setCameraError("Fotocamera non disponibile: descrivi tu cosa vedi, ci penso io."));
    return () => {
      cancelled = true;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, [tab]);

  useEffect(() => () => stopCamera(streamRef.current), []);

  const busy = phase === "analyzing";

  /** Scatto reale: foto → AI (se permessa) → OCR → review sempre modificabile. */
  const shoot = async () => {
    const video = videoRef.current;
    if (!video || busy) return;
    haptic(15);
    setPhase("analyzing");
    setNotice(null);
    try {
      const blob = await captureFrame(video);
      if (!blob) throw new Error("frame vuoto");

      if (visionAllowed) {
        try {
          const base64 = await blobToBase64(blob);
          const result = await analyzePhoto(base64, intent, intent === "custom" ? customQ : undefined);
          onVisionUsed();
          setReview(visionToParsed(result));
          setPhase("review");
          haptic([10, 40, 10]);
          return;
        } catch {
          setNotice("L'analisi AI non ha risposto: ho letto il testo della foto.");
        }
      } else {
        setNotice("Analisi AI di oggi esaurite: ho letto solo il testo della foto.");
      }

      // Fallback: OCR locale → euristica
      const recognized = await recognizeText(blob);
      if (recognized) {
        setReview(parseCapture(recognized));
        setPhase("review");
      } else {
        setNotice("Non ho letto nulla nella foto: scrivimi tu cosa vedi.");
        setTab("text");
        setPhase("compose");
      }
    } catch {
      setNotice("Scatto non riuscito: scrivimi tu cosa vedi.");
      setTab("text");
      setPhase("compose");
    }
  };

  /** Percorso testuale/vocale: euristica locale, poi review. */
  const composeFromText = () => {
    const t = text.trim();
    if (!t || busy) return;
    haptic(10);
    setPhase("analyzing");
    // piccola pausa per l'animazione di Iris che "legge"
    setTimeout(() => {
      setReview(parseCapture(t));
      setPhase("review");
    }, 900);
  };

  const confirmSave = () => {
    if (!review) return;
    haptic([10, 30]);
    onSave(review, moodIdx);
  };

  return (
    <Modal onClose={() => !busy && onClose()} labelledBy="capture-title">
      <h2 id="capture-title" className="sr-only">
        Nuovo ricordo
      </h2>

      {phase !== "review" && (
        <>
          <div className="relative flex h-52 items-center justify-center overflow-hidden" style={{ background: "radial-gradient(80% 100% at 50% 0%, rgba(67,56,202,.25), #0e0e15)" }}>
            {tab === "camera" ? (
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            ) : (
              <Iris mood={busy ? "working" : speech.listening ? "search" : "idle"} size={92} />
            )}
            {busy && (
              <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
                <div className="sm-scan absolute h-[2px] w-full" style={{ background: "linear-gradient(90deg,transparent,#fbbf24,transparent)" }} />
              </div>
            )}
            <span className="absolute left-4 top-4 h-5 w-5 border-l-2 border-t-2 border-white/25" />
            <span className="absolute right-4 top-4 h-5 w-5 border-r-2 border-t-2 border-white/25" />
            <span className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-white/25" />
            <span className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-white/25" />
            {speech.listening && (
              <p className="absolute bottom-3 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-black/60 px-4 py-1 text-sm text-amber-200">
                {speech.interim || "Ti ascolto…"}
              </p>
            )}
          </div>

          <div className="space-y-4 p-6 pt-4">
            {/* Cosa deve guardare Iris: un tap, niente digitazione */}
            <div>
              <p className="text-[11px] uppercase tracking-[.14em] text-white/55">Cosa deve guardare Iris?</p>
              <div className="scrollbar-none -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Intento dello scatto">
                {VISION_INTENT_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setIntent(id);
                      haptic(6);
                    }}
                    aria-pressed={intent === id}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] transition active:scale-95 ${
                      intent === id ? "bg-amber-300/20 font-medium text-amber-200 ring-1 ring-amber-300/50" : "bg-white/[.05] text-white/70 ring-1 ring-white/10"
                    }`}
                  >
                    {VISION_INTENTS[id].chip}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIntent("custom");
                    haptic(6);
                  }}
                  aria-pressed={intent === "custom"}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] transition active:scale-95 ${
                    intent === "custom" ? "bg-amber-300/20 font-medium text-amber-200 ring-1 ring-amber-300/50" : "bg-white/[.05] text-white/70 ring-1 ring-white/10"
                  }`}
                >
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.75} />
                  Chiedi altro…
                </button>
              </div>
              {intent === "custom" && (
                <input
                  value={customQ}
                  onChange={(e) => setCustomQ(e.target.value)}
                  placeholder="Es. «Che pianta è questa?»"
                  aria-label="Domanda libera per Iris"
                  className="mt-2 w-full rounded-2xl bg-white/[.05] px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-amber-300/60"
                />
              )}
              {visionAllowed && Number.isFinite(visionRemaining) && (
                <p className="mt-1.5 text-[11px] text-white/45">{visionRemaining} analisi AI rimaste oggi</p>
              )}
            </div>

            <div className="flex gap-1 rounded-full bg-white/[.04] p-1 text-sm">
              <button
                onClick={() => setTab("text")}
                className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full transition ${tab === "text" ? "bg-white font-medium text-[#08080A]" : "text-white/60"}`}
              >
                <TypeIcon className="h-3.5 w-3.5" strokeWidth={1.75} /> Scrivi
              </button>
              <button
                onClick={() => setTab("camera")}
                className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full transition ${tab === "camera" ? "bg-white font-medium text-[#08080A]" : "text-white/60"}`}
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={1.75} /> Fotocamera
              </button>
            </div>

            {notice && <p className="rounded-xl bg-amber-300/10 px-3 py-2 text-sm text-amber-200/90">{notice}</p>}

            {tab === "camera" ? (
              <div className="space-y-2">
                {cameraError && <p className="text-sm text-rose-300/90">{cameraError}</p>}
                <button
                  onClick={shoot}
                  disabled={!!cameraError || busy}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] transition active:scale-[.98] disabled:opacity-40"
                >
                  {busy ? "Iris sta guardando…" : (
                    <>
                      <Camera className="h-4 w-4" strokeWidth={1.75} /> Scatta
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="capture-text" className="text-[11px] uppercase tracking-[.14em] text-white/55">
                  Cosa vuoi ricordare?
                </label>
                <div className="mt-2 flex items-end gap-2">
                  <textarea
                    id="capture-text"
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder="Es. «Scontrino cena, totale 42,00 €» · «Figurine nel cassetto della cucina»"
                    className="w-full resize-none rounded-2xl bg-white/[.05] px-4 py-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-amber-300/60"
                  />
                  {speech.supported && (
                    <button
                      onPointerDown={() => {
                        haptic(12);
                        speech.start();
                      }}
                      onPointerUp={speech.stop}
                      onPointerLeave={speech.stop}
                      aria-label="Tieni premuto e detta il ricordo"
                      className={`flex min-h-12 min-w-12 shrink-0 touch-none items-center justify-center rounded-2xl transition active:scale-95 ${
                        speech.listening ? "bg-amber-300/25 text-amber-200 ring-1 ring-amber-300/60" : "bg-white/[.05] text-white/70 ring-1 ring-white/10"
                      }`}
                    >
                      <Mic className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-white/45">
                  {speech.supported ? "Tieni premuto il microfono e detta: zero digitazione." : "Oppure scatta con la fotocamera: Iris guarda da sola."}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] uppercase tracking-[.14em] text-white/55">
                Come ti senti? <span className="normal-case tracking-normal text-white/40">(opzionale)</span>
              </p>
              <div className="mt-2 flex gap-2" role="group" aria-label="Umore dello scatto">
                {MOOD_EMOJI.map((e, i) => (
                  <button
                    key={e}
                    onClick={() => {
                      setMoodIdx(moodIdx === i ? null : (i as MoodIndex));
                      haptic(6);
                    }}
                    aria-pressed={moodIdx === i}
                    aria-label={`Umore ${i + 1} di 5`}
                    className={`min-h-11 min-w-11 rounded-full text-xl transition active:scale-90 ${
                      moodIdx === i ? "bg-amber-300/20 ring-1 ring-amber-300/50" : "bg-white/[.04] hover:bg-white/[.08]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {tab === "text" && (
              <button
                onClick={composeFromText}
                disabled={!text.trim() || busy}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] transition active:scale-[.98] disabled:opacity-40"
              >
                {busy ? "Iris sta leggendo…" : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2} /> Prepara il ricordo
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}

      {/* ---- REVIEW: la proposta di Iris, sempre modificabile ---- */}
      {phase === "review" && review && (
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Iris mood="happy" size={44} />
            <div>
              <p className="font-semibold">Ecco cosa ho capito</p>
              <p className="text-sm text-white/55">Correggimi pure: i ricordi sono tuoi.</p>
            </div>
          </div>

          <div>
            <label htmlFor="rev-title" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Titolo
            </label>
            <input
              id="rev-title"
              value={review.title}
              onChange={(e) => setReview({ ...review, title: e.target.value })}
              className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
            />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[.14em] text-white/55">Categoria</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Categoria proposta">
              {Object.entries(CATS).map(([k, c]) => (
                <button
                  key={k}
                  onClick={() => setReview({ ...review, cat: k as CategoryId, locked: k === "segreto" })}
                  aria-pressed={review.cat === k}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${
                    review.cat === k ? "bg-white font-medium text-[#08080A]" : "bg-white/[.05] text-white/70"
                  }`}
                >
                  <c.Icon className={`h-3.5 w-3.5 ${review.cat === k ? "" : c.tint}`} strokeWidth={1.75} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rev-desc" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Descrizione
            </label>
            <textarea
              id="rev-desc"
              value={review.summary}
              onChange={(e) => setReview({ ...review, summary: e.target.value, ocr: e.target.value })}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl bg-white/[.05] px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="rev-amount" className="text-[11px] uppercase tracking-[.14em] text-white/55">
                Importo (€)
              </label>
              <input
                id="rev-amount"
                inputMode="decimal"
                value={review.amount != null ? String(review.amount) : ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(",", "."));
                  setReview({ ...review, amount: Number.isFinite(v) ? v : undefined });
                }}
                placeholder="—"
                className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="rev-expiry" className="text-[11px] uppercase tracking-[.14em] text-white/55">
                Scadenza
              </label>
              <input
                id="rev-expiry"
                type="date"
                value={review.expiry ?? ""}
                onChange={(e) => setReview({ ...review, expiry: e.target.value || undefined })}
                className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rev-tags" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Tag
            </label>
            <input
              id="rev-tags"
              value={review.tags.join(", ")}
              onChange={(e) =>
                setReview({ ...review, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })
              }
              className="mt-1 w-full rounded-xl bg-white/[.05] px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-300/60"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={confirmSave}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] transition active:scale-[.98]"
            >
              <Check className="h-4 w-4" strokeWidth={2} /> Salva il ricordo
            </button>
            <button
              onClick={() => {
                setPhase("compose");
                setReview(null);
              }}
              className="min-h-12 rounded-2xl bg-white/[.06] px-4 text-sm text-white/80 ring-1 ring-white/10"
            >
              Rifai
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function visionToParsed(v: VisionResult): ParsedCapture {
  return {
    cat: v.category,
    title: v.title || "Ricordo",
    summary: v.description,
    ocr: v.description,
    tags: v.tags,
    amount: v.amount ?? undefined,
    locked: v.category === "segreto",
    expiry: v.expiry ?? undefined,
  };
}
