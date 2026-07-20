import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getRecognizer(): SpeechRecognitionLike | null {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const r: SpeechRecognitionLike = new Ctor();
  r.lang = "it-IT";
  r.continuous = true;
  r.interimResults = true;
  return r;
}

/**
 * Cattura vocale: tieni premuto → detti → Iris trascrive (Web Speech API,
 * italiano). `supported` è false dove il browser non lo offre.
 */
export function useSpeech(onFinalText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => () => recRef.current?.abort(), []);

  const start = useCallback(() => {
    if (!supported || recRef.current) return;
    const rec = getRecognizer();
    if (!rec) return;
    recRef.current = rec;
    setInterim("");
    rec.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onFinalText(res[0].transcript.trim());
        else interimText += res[0].transcript;
      }
      setInterim(interimText);
    };
    rec.onerror = () => {
      setListening(false);
      recRef.current = null;
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      recRef.current = null;
    };
    rec.start();
    setListening(true);
  }, [supported, onFinalText]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  return { supported, listening, interim, start, stop };
}
