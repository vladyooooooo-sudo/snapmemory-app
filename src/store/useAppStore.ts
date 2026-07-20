import { useCallback, useEffect, useState } from "react";
import { store } from "../lib/storage";
import { dayKey } from "../lib/date";
import { newId } from "../lib/id";
import { bump } from "../lib/usage";
import { defaultUsage } from "../lib/usage";
import { DEFAULT_ACCENT } from "../constants/accents";
import { CATS } from "../constants/categories";
import type { Memory, MoodIndex, PersistedState, Plan, Profile, WidgetInstance, CategoryId } from "../types";
import type { ParsedCapture } from "../lib/parseCapture";

export interface Celebration {
  title: string;
  sub: string;
}

const saved = store.load();

function initial<K extends keyof PersistedState>(key: K, fallback: PersistedState[K]): PersistedState[K] {
  return saved?.[key] ?? fallback;
}

export function useAppStore() {
  const [profile, setProfile] = useState<Profile | null>(() => initial("profile", null));
  const [myCats, setMyCats] = useState<CategoryId[]>(() => initial("myCats", []));
  const [widgets, setWidgets] = useState<WidgetInstance[]>(() => initial("widgets", []));
  const [items, setItems] = useState<Memory[]>(() => initial("items", []));
  const [streak, setStreak] = useState<number>(() => initial("streak", 0));
  const [lastSave, setLastSave] = useState<string | null>(() => initial("lastSave", null));
  const [pinHash, setPinHash] = useState<string | null>(() => initial("pinHash", null));
  const [pinSalt, setPinSalt] = useState<string | null>(() => initial("pinSalt", null));
  const [sounds, setSounds] = useState<boolean>(() => initial("sounds", false));
  const [answered, setAnswered] = useState<string | null>(() => initial("answered", null));
  const [plan, setPlan] = useState<Plan>(() => initial("plan", "free"));
  const [accent, setAccent] = useState<string>(() => initial("accent", DEFAULT_ACCENT));
  const [fontLarge, setFontLarge] = useState<boolean>(() => initial("fontLarge", false));
  const [usage, setUsage] = useState(() => initial("usage", defaultUsage()));

  const doneToday = lastSave === dayKey();

  useEffect(() => {
    if (!profile) return;
    store.save({
      profile,
      myCats,
      widgets,
      items,
      streak,
      lastSave,
      pinHash,
      pinSalt,
      sounds,
      answered,
      plan,
      accent,
      fontLarge,
      usage,
    });
  }, [profile, myCats, widgets, items, streak, lastSave, pinHash, pinSalt, sounds, answered, plan, accent, fontLarge, usage]);

  /** Salva un nuovo ricordo, aggiorna la streak (anno incluso) e ritorna l'eventuale celebrazione. */
  const saveMemory = useCallback(
    (parsed: ParsedCapture, moodIdx: MoodIndex | null = null): { memory: Memory; celebrate: Celebration | null } => {
      const nuovo: Memory = { ...parsed, id: newId(), date: new Date().toISOString(), mood: moodIdx };
      setItems((s) => [nuovo, ...s]);

      const first = lastSave !== dayKey();
      let celebrate: Celebration | null = null;
      if (first) {
        const yesterday = dayKey(new Date(Date.now() - 86_400_000));
        const ns = lastSave === yesterday ? streak + 1 : 1;
        setStreak(ns);
        setLastSave(dayKey());
        const milestone = [7, 30, 100].includes(ns);
        celebrate = {
          title: milestone ? `${ns} giorni. Davvero.` : "Fatto per oggi.",
          sub: milestone
            ? "Iris se lo ricorderà. Anche tu, ormai."
            : `Giorno ${ns}${ns > 1 ? " di fila" : ""}. A domani${profile?.nick ? ", " + profile.nick : ""}.`,
        };
      }
      return { memory: nuovo, celebrate };
    },
    [lastSave, streak, profile]
  );

  const editMemory = useCallback((id: string, patch: Partial<Pick<Memory, "title" | "cat" | "tags" | "amount">>) => {
    setItems((s) => s.map((m) => (m.id === id ? { ...m, ...patch, locked: patch.cat ? patch.cat === "segreto" : m.locked } : m)));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setItems((s) => s.filter((m) => m.id !== id));
  }, []);

  const toggleIdea = useCallback((id: string) => {
    setItems((s) => s.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  }, []);

  const saveFrase = useCallback(
    (question: string, text: string) => {
      const res = saveMemory(
        { cat: "idea", title: question, summary: text, ocr: text, tags: ["diario"], locked: false },
        null
      );
      setAnswered(dayKey());
      return res;
    },
    [saveMemory]
  );

  const finishOnboarding = useCallback(
    (name: string, nick: string, cats: CategoryId[]): WidgetInstance[] => {
      const finalCats = cats.length ? cats : (Object.keys(CATS) as CategoryId[]);
      const pack: WidgetInstance[] = [
        { id: "hero", size: "L" },
        { id: "streak", size: "S" },
        { id: "frase", size: "M" },
        { id: "recenti", size: "L" },
      ];
      if (finalCats.includes("spesa")) pack.splice(2, 0, { id: "speso", size: "S" });
      if (finalCats.includes("segreto")) pack.push({ id: "vault", size: "S" });
      if (finalCats.includes("evento")) pack.push({ id: "evento", size: "M" });

      setProfile({ name, nick: nick || name.split(" ")[0] });
      setMyCats(finalCats);
      setWidgets(pack);
      return pack;
    },
    []
  );

  const resetAll = useCallback(() => {
    store.reset();
    setProfile(null);
    setMyCats([]);
    setWidgets([]);
    setItems([]);
    setStreak(0);
    setLastSave(null);
    setPinHash(null);
    setPinSalt(null);
    setAnswered(null);
    setPlan("free");
    setAccent(DEFAULT_ACCENT);
    setFontLarge(false);
    setUsage(defaultUsage());
  }, []);

  const addWidget = useCallback((id: WidgetInstance["id"], size: WidgetInstance["size"]) => {
    setWidgets((s) => (s.find((w) => w.id === id) ? s : [...s, { id, size }]));
  }, []);
  const removeWidget = useCallback((id: WidgetInstance["id"]) => {
    setWidgets((s) => s.filter((w) => w.id !== id));
  }, []);
  const resizeWidget = useCallback((id: WidgetInstance["id"], size: WidgetInstance["size"]) => {
    setWidgets((s) => s.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);
  const reorderWidgets = useCallback((from: number, to: number) => {
    setWidgets((s) => {
      const c = [...s];
      const [x] = c.splice(from, 1);
      c.splice(to, 0, x);
      return c;
    });
  }, []);
  const moveWidget = useCallback((id: WidgetInstance["id"], dir: -1 | 1) => {
    setWidgets((s) => {
      const i = s.findIndex((w) => w.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const c = [...s];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  }, []);

  const bumpUsage = useCallback((feature: "domandeIris" | "export") => {
    setUsage((u) => {
      if (feature === "domandeIris") return { ...u, domandeIrisPerGiorno: bump(u.domandeIrisPerGiorno, "day") };
      return { ...u, exportPerSettimana: bump(u.exportPerSettimana, "week") };
    });
  }, []);

  const setUpgradePromptedToday = useCallback(() => {
    setUsage((u) => ({ ...u, upgradePromptedOn: dayKey() }));
  }, []);

  const setPin = useCallback((salt: string, hash: string) => {
    setPinSalt(salt);
    setPinHash(hash);
  }, []);

  const loadImported = useCallback((data: PersistedState) => {
    setProfile(data.profile);
    setMyCats(data.myCats);
    setWidgets(data.widgets);
    setItems(data.items);
    setStreak(data.streak);
    setLastSave(data.lastSave);
    setPinHash(data.pinHash);
    setPinSalt(data.pinSalt);
    setSounds(data.sounds);
    setAnswered(data.answered);
    setPlan(data.plan);
    setAccent(data.accent);
    setFontLarge(data.fontLarge);
    setUsage(data.usage);
  }, []);

  const currentPersisted = (): PersistedState => ({
    profile,
    myCats,
    widgets,
    items,
    streak,
    lastSave,
    pinHash,
    pinSalt,
    sounds,
    answered,
    plan,
    accent,
    fontLarge,
    usage,
  });

  return {
    profile,
    myCats,
    widgets,
    items,
    streak,
    lastSave,
    pinHash,
    pinSalt,
    sounds,
    setSounds,
    answered,
    plan,
    setPlan,
    accent,
    setAccent,
    fontLarge,
    setFontLarge,
    usage,
    doneToday,
    saveMemory,
    editMemory,
    deleteMemory,
    toggleIdea,
    saveFrase,
    finishOnboarding,
    resetAll,
    addWidget,
    removeWidget,
    resizeWidget,
    reorderWidgets,
    moveWidget,
    bumpUsage,
    setUpgradePromptedToday,
    setPin,
    loadImported,
    currentPersisted,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
