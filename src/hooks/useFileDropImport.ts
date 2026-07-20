import { useEffect, useState } from "react";

interface Options {
  enabled: boolean;
  onFileDropped: (file: File | null) => void;
}

/**
 * Import via drag&drop di un file qualsiasi: apre lo scatto pre-compilato.
 * Bug corretto: i listener ora controllano `e.dataTransfer.types.includes
 * ("Files")` prima di reagire, quindi non si attivano più per il riordino
 * interno dei widget (che oggi usa @dnd-kit, non le API HTML5 native, e
 * quindi non genera comunque eventi drag/drop su window).
 */
export function useFileDropImport({ enabled, onFileDropped }: Options) {
  const [dropHint, setDropHint] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const isFileDrag = (e: DragEvent) => !!e.dataTransfer?.types.includes("Files");

    const over = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setDropHint(true);
    };
    const leave = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      setDropHint(false);
    };
    const drop = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setDropHint(false);
      const f = e.dataTransfer?.files?.[0] ?? null;
      onFileDropped(f);
    };

    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [enabled, onFileDropped]);

  return dropHint;
}
