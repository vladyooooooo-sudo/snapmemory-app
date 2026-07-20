import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAppStore } from "./store/useAppStore";
import type { Celebration } from "./store/useAppStore";
import { AccentProvider } from "./context/AccentContext";
import { Onboarding } from "./components/Onboarding";
import { Header } from "./components/Header";
import { Dock } from "./components/Dock";
import { WidgetGrid } from "./components/WidgetGrid";
import { WidgetContent } from "./components/WidgetContent";
import { Toast } from "./components/Toast";
import { CaptureModal } from "./components/modals/CaptureModal";
import { MemoryDetailModal } from "./components/modals/MemoryDetailModal";
import { PinModal } from "./components/modals/PinModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { LibraryModal } from "./components/modals/LibraryModal";
import { SpotlightModal, type AskAnswer } from "./components/modals/SpotlightModal";
import { CelebrateModal } from "./components/modals/CelebrateModal";
import { ArchiveModal } from "./components/modals/ArchiveModal";
import { UpgradeModal } from "./components/modals/UpgradeModal";
import { ReportModal } from "./components/modals/ReportModal";
import { useLimits } from "./hooks/useLimits";
import { useToast } from "./hooks/useToast";
import { useFileDropImport } from "./hooks/useFileDropImport";
import { useVaultAutoLock } from "./hooks/useVaultAutoLock";
import type { ParsedCapture } from "./lib/parseCapture";
import { dayKey, daysAgo } from "./lib/date";
import { beep } from "./lib/sound";
import { currentCount } from "./lib/usage";
import { upcomingExpiries, expiryLabel } from "./lib/expiry";
import { CATS } from "./constants/categories";
import { WIDGET_META } from "./constants/widgets";
import { questionOfDay } from "./constants/questions";
import { DEFAULT_ACCENT } from "./constants/accents";
import { monthlyExpenses, monthlyMoods, anniversaryMemories, peopleMemories, pendingIdeas, upcomingEvents } from "./lib/derived";
import { exportToJSON, importFromJSON } from "./lib/storage";
import type { CategoryId, IrisMood, LimitedFeature, Memory, MoodIndex, WidgetId } from "./types";

const CATEGORY_LABEL: Record<LimitedFeature, string> = {
  memorie: "Ricordi salvati",
  widget: "Widget in dashboard",
  domandeIris: "Domande a Iris",
  vault: "Cassaforte",
  export: "Export",
  annofaStorico: "Storico 'Un anno fa'",
  umoreStorico: "Storico Umore",
  accent: "Colori accento",
  visionAI: "Analisi AI delle foto",
};

export default function App() {
  const store = useAppStore();
  const { toast, show } = useToast();

  const [mood, setMood] = useState<IrisMood>("idle");
  const [capOpen, setCapOpen] = useState(false);
  const [capInitialText, setCapInitialText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<Celebration | null>(null);
  const [spot, setSpot] = useState(false);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [open, setOpen] = useState<Memory | null>(null);
  const [vault, setVault] = useState(false);
  const [pinUI, setPinUI] = useState<"set" | "ask" | null>(null);
  const [big, setBig] = useState(false);
  const [lib, setLib] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [upgrade, setUpgrade] = useState<LimitedFeature | null>(null);
  const [fraseText, setFraseText] = useState("");

  const moodTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(moodTimer.current), []);

  const react = useCallback(
    (m: IrisMood, ms = 1600, msg?: string | null) => {
      clearTimeout(moodTimer.current);
      setMood(m);
      if (msg) show(msg);
      if (m === "happy" && store.sounds) beep("pop");
      moodTimer.current = setTimeout(() => setMood("idle"), ms);
    },
    [store.sounds, show]
  );

  /* ---------- derivati (year-aware, sensibili al piano) ---------- */
  const { monthSpese, totMese } = useMemo(() => monthlyExpenses(store.items), [store.items]);
  const moods = useMemo(() => monthlyMoods(store.items, store.plan), [store.items, store.plan]);
  const anniversary = useMemo(() => anniversaryMemories(store.items, store.plan), [store.items, store.plan]);
  const persone = useMemo(() => peopleMemories(store.items), [store.items]);
  const idee = useMemo(() => pendingIdeas(store.items), [store.items]);
  const eventi = useMemo(() => upcomingEvents(store.items), [store.items]);

  /* ---------- limiti Free/Pro ---------- */
  const todayCount = useMemo(() => store.items.filter((m) => dayKey(m.date) === dayKey()).length, [store.items]);
  const vaultCount = useMemo(() => store.items.filter((m) => m.locked).length, [store.items]);
  const memorieLimit = useLimits("memorie", todayCount, store.plan);
  const widgetLimit = useLimits("widget", store.widgets.length, store.plan);
  const domandeCount = currentCount(store.usage.domandeIrisPerGiorno, "day");
  const domandeLimit = useLimits("domandeIris", domandeCount, store.plan);
  const vaultLimit = useLimits("vault", vaultCount, store.plan);
  const exportCount = currentCount(store.usage.exportPerSettimana, "week");
  const exportLimit = useLimits("export", exportCount, store.plan);
  const visionCount = currentCount(store.usage.visionPerGiorno, "day");
  const visionLimit = useLimits("visionAI", visionCount, store.plan);

  const expiring = useMemo(() => upcomingExpiries(store.items), [store.items]);

  const limitByFeature: Record<LimitedFeature, ReturnType<typeof useLimits>> = {
    memorie: memorieLimit,
    widget: widgetLimit,
    domandeIris: domandeLimit,
    vault: vaultLimit,
    export: exportLimit,
    visionAI: visionLimit,
    annofaStorico: { allowed: true, remaining: Infinity, limit: null, resetAt: null },
    umoreStorico: { allowed: true, remaining: Infinity, limit: null, resetAt: null },
    accent: { allowed: true, remaining: Infinity, limit: null, resetAt: null },
  };

  const attemptOpenCapture = useCallback(() => {
    if (!memorieLimit.allowed) {
      setUpgrade("memorie");
      return;
    }
    setCapInitialText("");
    setCapOpen(true);
  }, [memorieLimit.allowed]);

  /* ---------- import file via drag&drop (separato dal riordino widget) ---------- */
  const dropHint = useFileDropImport({
    enabled: !!store.profile,
    onFileDropped: (file) => {
      if (!memorieLimit.allowed) {
        setUpgrade("memorie");
        return;
      }
      setCapInitialText(file ? `Screenshot importato: ${file.name.replace(/\.[a-z]+$/i, "")}` : "");
      setCapOpen(true);
    },
  });

  /* ---------- scorciatoie ed Escape ---------- */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpot(true);
      }
      if (e.key === "Escape") {
        setSpot(false);
        setOpen(null);
        setPinUI(null);
        setCelebrate(null);
        setLib(false);
        setCapOpen(false);
        setSettingsOpen(false);
        setArchiveOpen(false);
        setReportOpen(false);
        setMenuFor(null);
        setUpgrade(null);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  useVaultAutoLock(vault, () => {
    setVault(false);
  });

  /* ---------- scorciatoie PWA (long-press sull'icona: Scatta / Cerca) ---------- */
  const shortcutHandled = useRef(false);
  useEffect(() => {
    if (shortcutHandled.current || !store.profile) return;
    shortcutHandled.current = true;
    const action = new URLSearchParams(window.location.search).get("action");
    if (action === "capture") setCapOpen(true);
    if (action === "search") setSpot(true);
    if (action) window.history.replaceState(null, "", window.location.pathname);
  }, [store.profile]);

  /* ---------- promemoria scadenze: Iris avvisa, una volta al giorno ---------- */
  useEffect(() => {
    if (!store.profile) return;
    const urgent = expiring.filter((x) => x.daysLeft >= 0 && x.daysLeft <= 7);
    if (!urgent.length) return;
    const key = "snapmemory:expiry-notified";
    try {
      if (localStorage.getItem(key) === dayKey()) return;
      localStorage.setItem(key, dayKey());
    } catch {
      // storage non disponibile: si mostra comunque il toast
    }
    const first = urgent[0];
    show(`${first.memory.title}: ${expiryLabel(first.daysLeft)}`, 4000);
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Iris ti ricorda", { body: `${first.memory.title} — ${expiryLabel(first.daysLeft)}` });
      } catch {
        // alcune piattaforme richiedono il service worker: il toast basta
      }
    }
  }, [store.profile, expiring, show]);

  /* ---------- cattura: il modale prepara il ricordo, qui si salva ---------- */
  const saveCapture = (parsed: ParsedCapture, moodIdx: MoodIndex | null) => {
    if (parsed.locked && !vaultLimit.allowed) {
      setCapOpen(false);
      setUpgrade("vault");
      return;
    }
    if (store.sounds) beep("shutter");
    const wasDoneToday = store.doneToday;
    const { memory, celebrate: c } = store.saveMemory(parsed, moodIdx);
    setCapOpen(false);
    if (c) setCelebrate(c);
    react("happy", 2200, c ? null : "Ricordo salvato");
    if (wasDoneToday) setOpen(memory);
  };

  const saveFraseAnswer = () => {
    const txt = fraseText.trim();
    if (!txt) return;
    if (!memorieLimit.allowed) {
      setUpgrade("memorie");
      return;
    }
    const { celebrate: c } = store.saveFrase(questionOfDay(), txt);
    setFraseText("");
    if (c) setCelebrate(c);
    react("happy", 2200, c ? null : "Ricordo salvato");
  };

  /* ---------- ricerca conversazionale ---------- */
  const words = useMemo(() => q.trim().toLowerCase().split(/\s+/).filter((x) => x.length > 2), [q]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (!domandeLimit.allowed) {
      setUpgrade("domandeIris");
      return;
    }
    store.bumpUsage("domandeIris");
    setMood("search");
    setAnswer({ loading: true });
    setTimeout(() => {
      const w = t.toLowerCase().split(/\s+/).filter((x) => x.length > 2);
      const scored = store.items
        .map((m) => {
          const hay = `${m.title} ${m.ocr} ${m.summary} ${m.tags.join(" ")} ${CATS[m.cat].label}`.toLowerCase();
          return { m, s: w.reduce((a, x) => a + (hay.includes(x) ? 1 : 0), 0) };
        })
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 2);

      let reply: string;
      const low = t.toLowerCase();
      if (/dove (l'ho|ho|le ho|li ho|la ho) (messo|messa|messi|messe|riposto|lasciato|lasciata)|dov'è|dove sta|dove si trova/.test(low)) {
        // «Dove l'ho messo?» — priorità ai ricordi-posizione
        const positions = scored.filter((x) => x.m.cat === "posizione" || x.m.cat === "luogo");
        const best = positions[0] ?? scored[0];
        reply = best
          ? `Me lo hai detto ${new Date(best.m.date).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}: ${best.m.summary}`
          : "Non me lo hai ancora fotografato. La prossima volta che lo riponi, scattami una foto col chip «Dove l'ho messo» e non lo perdi più.";
      } else if (/quanto|spes|euro|€|costat/.test(low)) {
        const week = /settimana/.test(low);
        const pool = store.items.filter((m) => m.amount != null && (!week || daysAgo(m.date) <= 7));
        const tot = pool.reduce((a, m) => a + (m.amount ?? 0), 0);
        reply = pool.length
          ? `${week ? "Questa settimana" : "Finora"} hai registrato ${tot.toFixed(2)} € in ${pool.length} ${pool.length === 1 ? "scontrino" : "scontrini"}.${scored[0] ? " Il più rilevante è qui sotto." : ""}`
          : "Non hai ancora registrato spese. Al primo scontrino inizio a fare i conti io.";
      } else {
        reply = scored.length ? scored[0].m.summary : "Non ho ancora un ricordo su questo.";
      }

      setAnswer({ reply, proofs: scored.map((x) => x.m) });
      react(scored.length || /quanto/.test(low) ? "happy" : "sad", 1800);
    }, 900);
  };

  /* ---------- ricordi: apertura, modifica, eliminazione ---------- */
  const openMemory = (m: Memory) => {
    setOpen(m);
    if (daysAgo(m.date) > 360) react("nostalgia", 2600);
  };

  /* ---------- widget ---------- */
  const handleAddWidget = (id: WidgetId) => {
    if (!widgetLimit.allowed) {
      setUpgrade("widget");
      return;
    }
    store.addWidget(id, WIDGET_META[id].size);
    setLib(false);
    react("happy", 1200, "Widget aggiunto");
  };

  const visibleWidgets = useMemo(() => store.widgets.filter((w) => w.id !== "annofa" || anniversary.length > 0), [store.widgets, anniversary]);

  const handleReorderByIds = (activeId: string, overId: string) => {
    const from = store.widgets.findIndex((w) => w.id === activeId);
    const to = store.widgets.findIndex((w) => w.id === overId);
    if (from >= 0 && to >= 0) store.reorderWidgets(from, to);
  };

  /* ---------- backup ---------- */
  const handleExport = () => {
    if (!exportLimit.allowed) {
      setUpgrade("export");
      return;
    }
    const json = exportToJSON(store.currentPersisted());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapmemory-backup-${dayKey().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    store.bumpUsage("export");
    show("Backup esportato");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = importFromJSON(String(reader.result ?? ""));
      if (!data) {
        show("File non valido");
        return;
      }
      store.loadImported(data);
      show("Backup importato");
      setSettingsOpen(false);
    };
    reader.readAsText(file);
  };

  /* ==================== ONBOARDING ==================== */
  if (!store.profile) {
    return (
      <AccentProvider accentId={DEFAULT_ACCENT}>
        <Onboarding
          onFinish={(name, nick, cats, firstSnap) => {
            store.finishOnboarding(name, nick, cats as CategoryId[]);
            if (firstSnap) setTimeout(() => attemptOpenCapture(), 350);
          }}
        />
      </AccentProvider>
    );
  }

  const profile = store.profile;

  return (
    <AccentProvider accentId={store.accent}>
      <div className={`min-h-screen w-full bg-[#08080A] text-white ${big ? "text-[17px]" : "text-[15px]"}`}>
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: "radial-gradient(55% 40% at 50% 0%, rgba(251,191,36,.06), transparent 70%)" }}
        />

        {dropHint && (
          <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center border-4 border-dashed border-amber-300/40 bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-8 w-8 text-amber-300" strokeWidth={1.75} />
              <p className="text-white/80">Lascia qui: Iris se ne occupa</p>
            </div>
          </div>
        )}

        <Header profile={profile} mood={mood} big={big} onToggleBig={() => setBig((b) => !b)} onOpenSettings={() => setSettingsOpen(true)} onOpenSpotlight={() => setSpot(true)} />

        <main className="relative mx-auto max-w-5xl px-6 pb-40 pt-6">
          <WidgetGrid
            widgets={visibleWidgets}
            renderWidget={(id) => (
              <WidgetContent
                id={id}
                profile={profile}
                doneToday={store.doneToday}
                streak={store.streak}
                items={store.items}
                monthSpese={monthSpese}
                totMese={totMese}
                eventi={eventi}
                anniversary={anniversary}
                moods={moods}
                persone={persone}
                idee={idee}
                vaultOpen={vault}
                userHasPin={!!store.pinHash}
                answeredToday={store.answered === dayKey()}
                fraseText={fraseText}
                setFraseText={setFraseText}
                expiring={expiring}
                onOpenCapture={attemptOpenCapture}
                onOpenMemory={openMemory}
                onOpenSpotlight={() => setSpot(true)}
                onSaveFrase={saveFraseAnswer}
                onToggleVault={() => {
                  setVault(false);
                  react("idle", 400, "Cassaforte chiusa");
                }}
                onOpenPin={() => setPinUI(store.pinHash ? "ask" : "set")}
                onToggleIdea={(m) => store.toggleIdea(m.id)}
                onOpenReport={() => setReportOpen(true)}
              />
            )}
            onReorderByIds={handleReorderByIds}
            onMove={store.moveWidget}
            onResize={store.resizeWidget}
            onRemove={(id) => {
              store.removeWidget(id);
              setMenuFor(null);
            }}
            menuFor={menuFor}
            setMenuFor={setMenuFor}
          />

          <button
            onClick={() => setLib(true)}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm text-white/55 transition hover:border-white/30 hover:text-white/80"
          >
            Aggiungi widget
          </button>

          <footer className="mt-16 text-center text-xs text-white/40">SnapMemory © 2026 · Vladyo, CEO &amp; Founder</footer>
        </main>

        <Dock onOpenArchive={() => setArchiveOpen(true)} onOpenCapture={attemptOpenCapture} onOpenSpotlight={() => setSpot(true)} />

        {capOpen && (
          <CaptureModal
            initialText={capInitialText}
            visionAllowed={visionLimit.allowed}
            visionRemaining={visionLimit.remaining}
            onClose={() => setCapOpen(false)}
            onSave={saveCapture}
            onVisionUsed={() => store.bumpUsage("vision")}
          />
        )}

        {reportOpen && (
          <ReportModal
            items={store.items}
            nick={profile.nick}
            vaultOpen={vault}
            onClose={() => setReportOpen(false)}
            onOpenMemory={(m) => {
              setReportOpen(false);
              openMemory(m);
            }}
            onShared={() => show("Report pronto da condividere")}
          />
        )}

        {celebrate && <CelebrateModal celebrate={celebrate} onClose={() => setCelebrate(null)} />}

        {spot && (
          <SpotlightModal
            q={q}
            setQ={setQ}
            items={store.items}
            answer={answer}
            vaultOpen={vault}
            words={words}
            limitReached={!domandeLimit.allowed}
            onClose={() => setSpot(false)}
            onAsk={ask}
            onOpenMemory={(m) => {
              setSpot(false);
              openMemory(m);
            }}
            onCreateNew={() => {
              setSpot(false);
              attemptOpenCapture();
            }}
          />
        )}

        {lib && <LibraryModal widgets={store.widgets} limit={widgetLimit} onClose={() => setLib(false)} onAdd={handleAddWidget} />}

        {open && (
          <MemoryDetailModal
            memory={open}
            vaultOpen={vault}
            onClose={() => setOpen(null)}
            onEdit={store.editMemory}
            onDelete={store.deleteMemory}
            onRequestUnlock={() => {
              setOpen(null);
              setPinUI(store.pinHash ? "ask" : "set");
            }}
            onAction={(msg) => react("happy", 1600, msg)}
          />
        )}

        {pinUI && (
          <PinModal
            mode={pinUI}
            pinHash={store.pinHash}
            pinSalt={store.pinSalt}
            onClose={() => setPinUI(null)}
            onSet={(salt, hash) => {
              store.setPin(salt, hash);
              setVault(true);
              setPinUI(null);
              react("happy", 1600, "PIN creato, cassaforte aperta");
            }}
            onUnlock={() => {
              setVault(true);
              setPinUI(null);
              react("happy", 1600, "Cassaforte aperta");
            }}
          />
        )}

        {settingsOpen && (
          <SettingsModal
            store={store}
            onClose={() => setSettingsOpen(false)}
            onExport={handleExport}
            onImport={handleImport}
            onUpgrade={() => {
              store.setPlan("pro");
              show("Benvenuto in Pro");
            }}
            onDowngrade={() => {
              store.setPlan("free");
              store.setAccent(DEFAULT_ACCENT);
            }}
          />
        )}

        {archiveOpen && (
          <ArchiveModal
            items={store.items}
            vaultOpen={vault}
            onClose={() => setArchiveOpen(false)}
            onOpenMemory={(m) => {
              setArchiveOpen(false);
              openMemory(m);
            }}
          />
        )}

        {upgrade && (
          <UpgradeModal
            feature={CATEGORY_LABEL[upgrade]}
            limit={limitByFeature[upgrade]}
            onClose={() => setUpgrade(null)}
            onUpgrade={() => {
              store.setPlan("pro");
              setUpgrade(null);
              show("Benvenuto in Pro");
            }}
          />
        )}

        {toast && <Toast message={toast} />}
      </div>
    </AccentProvider>
  );
}
