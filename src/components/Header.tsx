import { Type, Settings } from "lucide-react";
import { Iris } from "./Iris";
import type { IrisMood, Profile } from "../types";

interface HeaderProps {
  profile: Profile;
  mood: IrisMood;
  big: boolean;
  onToggleBig: () => void;
  onOpenSettings: () => void;
  onOpenSpotlight: () => void;
}

export function Header({ profile, mood, big, onToggleBig, onOpenSettings, onOpenSpotlight }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[.05] bg-[#08080A]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold leading-tight tracking-tight">SnapMemory</h1>
          <p className="text-[11px] text-white/50">Ciao, {profile.nick}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onToggleBig}
            aria-label="Testo grande"
            aria-pressed={big}
            className={`min-h-11 min-w-11 rounded-full p-2.5 transition active:scale-90 ${big ? "bg-white/15" : "bg-white/[.04] hover:bg-white/[.08]"}`}
          >
            <Type className="mx-auto h-4 w-4" strokeWidth={1.75} />
          </button>
          <button onClick={onOpenSettings} aria-label="Impostazioni" className="min-h-11 min-w-11 rounded-full bg-white/[.04] p-2.5 transition hover:bg-white/[.08] active:scale-90">
            <Settings className="mx-auto h-4 w-4" strokeWidth={1.75} />
          </button>
          <Iris mood={mood} intro onClick={onOpenSpotlight} ariaLabel="Chiedi a Iris" />
        </div>
      </div>
    </header>
  );
}
