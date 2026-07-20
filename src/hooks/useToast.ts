import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Bug corretto: il prototipo avviava un setTimeout per nascondere il toast
 * senza salvarne il riferimento; due toast ravvicinati potevano chiudersi
 * in anticipo per colpa di un timer precedente ancora attivo. Qui il timer
 * è sempre in un ref dedicato, azzerato prima di ogni nuovo show() e alla
 * pulizia del componente.
 */
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((message: string, ms = 2400) => {
    clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);

  return { toast, show };
}
