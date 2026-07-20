import { Camera } from "lucide-react";

interface DockProps {
  onOpenArchive: () => void;
  onOpenCapture: () => void;
  onOpenSpotlight: () => void;
}

export function Dock({ onOpenArchive, onOpenCapture, onOpenSpotlight }: DockProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center pb-5">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0e0e15]/85 p-1.5 shadow-2xl backdrop-blur-xl">
        <button onClick={onOpenArchive} className="min-h-11 rounded-full px-4 text-sm text-white/70 transition hover:bg-white/10">
          Ricordi
        </button>
        <button onClick={onOpenCapture} aria-label="Scatta un nuovo ricordo" className="min-h-11 min-w-11 rounded-full bg-white p-3 text-[#08080A] transition active:scale-90">
          <Camera className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <button onClick={onOpenSpotlight} className="min-h-11 rounded-full px-4 text-sm text-white/70 transition hover:bg-white/10">
          Cerca
        </button>
      </div>
    </nav>
  );
}
