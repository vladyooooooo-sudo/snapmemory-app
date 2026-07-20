import { useEffect, useRef, useState } from "react";
import { Camera, Type as TypeIcon } from "lucide-react";
import { Iris } from "../Iris";
import { MOOD_EMOJI } from "../../constants/moods";
import { openCamera, stopCamera, captureFrame } from "../../lib/camera";
import { recognizeText } from "../../lib/ocr";
import { Modal } from "./Modal";
import type { IrisMood, MoodIndex } from "../../types";

interface CaptureModalProps {
  busy: boolean;
  irisMood: IrisMood;
  sounds: boolean;
  initialText?: string;
  onClose: () => void;
  onCapture: (text: string, moodIdx: MoodIndex | null) => void;
}

export function CaptureModal({ busy, irisMood, initialText = "", onClose, onCapture }: CaptureModalProps) {
  const [tab, setTab] = useState<"text" | "camera">("text");
  const [text, setText] = useState(initialText);
  const [moodIdx, setMoodIdx] = useState<MoodIndex | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      .catch(() => setCameraError("Fotocamera non disponibile: puoi comunque descrivere cosa vedi qui sotto."));
    return () => {
      cancelled = true;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, [tab]);

  // Ferma sempre la fotocamera se il componente si smonta durante l'attesa.
  useEffect(() => () => stopCamera(streamRef.current), []);

  const captureAndRead = async () => {
    const video = videoRef.current;
    if (!video) return;
    setOcrBusy(true);
    try {
      const blob = await captureFrame(video);
      if (!blob) throw new Error("frame vuoto");
      const recognized = await recognizeText(blob);
      setText(recognized || text);
      setTab("text");
    } catch {
      setCameraError("Non sono riuscita a leggere la foto: scrivimi tu cosa vedi.");
      setTab("text");
    } finally {
      setOcrBusy(false);
    }
  };

  const canSubmit = text.trim().length > 0 && !busy;

  return (
    <Modal onClose={() => !busy && onClose()} labelledBy="capture-title">
      <div className="relative flex h-44 items-center justify-center" style={{ background: "radial-gradient(80% 100% at 50% 0%, rgba(67,56,202,.25), #0e0e15)" }}>
        {tab === "camera" ? (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        ) : (
          <Iris mood={busy ? irisMood : "idle"} size={88} />
        )}
        {(busy || ocrBusy) && (
          <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
            <div className="sm-scan absolute h-[2px] w-full" style={{ background: "linear-gradient(90deg,transparent,#fbbf24,transparent)" }} />
          </div>
        )}
        <span className="absolute left-4 top-4 h-5 w-5 border-l-2 border-t-2 border-white/25" />
        <span className="absolute right-4 top-4 h-5 w-5 border-r-2 border-t-2 border-white/25" />
        <span className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-white/25" />
        <span className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-white/25" />
      </div>

      <div className="space-y-4 p-6">
        <h2 id="capture-title" className="sr-only">
          Nuovo ricordo
        </h2>

        <div className="flex gap-1 rounded-full bg-white/[.04] p-1 text-sm">
          <button
            onClick={() => setTab("text")}
            className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full transition ${tab === "text" ? "bg-white text-[#08080A] font-medium" : "text-white/60"}`}
          >
            <TypeIcon className="h-3.5 w-3.5" strokeWidth={1.75} /> Scrivi
          </button>
          <button
            onClick={() => setTab("camera")}
            className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full transition ${tab === "camera" ? "bg-white text-[#08080A] font-medium" : "text-white/60"}`}
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={1.75} /> Fotocamera
          </button>
        </div>

        {tab === "camera" ? (
          <div className="space-y-2">
            {cameraError && <p className="text-sm text-rose-300/90">{cameraError}</p>}
            <button
              onClick={captureAndRead}
              disabled={!streamRef.current || ocrBusy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] transition active:scale-[.98] disabled:opacity-40"
            >
              {ocrBusy ? "Iris sta leggendo la foto…" : (
                <>
                  <Camera className="h-4 w-4" strokeWidth={1.75} /> Scatta e leggi
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <label htmlFor="capture-text" className="text-[11px] uppercase tracking-[.14em] text-white/55">
              Cosa c'è nella foto?
            </label>
            <textarea
              id="capture-text"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Es. «Scontrino cena, totale 42,00 €» · «Posto 114, livello -2» · «Elena, la vicina dell'interno 4»"
              className="mt-2 w-full resize-none rounded-2xl bg-white/[.05] px-4 py-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-amber-300/60"
            />
            <p className="mt-1 text-[11px] text-white/45">Puoi anche scattare con la fotocamera: Iris legge il testo da sola.</p>
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
                onClick={() => setMoodIdx(moodIdx === i ? null : (i as MoodIndex))}
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

        <button
          onClick={() => canSubmit && onCapture(text, moodIdx)}
          disabled={!canSubmit}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-[#08080A] transition active:scale-[.98] disabled:opacity-40"
        >
          {busy ? "Iris sta leggendo…" : (
            <>
              <Camera className="h-4 w-4" strokeWidth={1.75} /> Salva il ricordo
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
