export type CategoryId = "spesa" | "luogo" | "evento" | "segreto" | "idea" | "persona" | "posizione";

export type Plan = "free" | "pro";

export type MoodIndex = 0 | 1 | 2 | 3 | 4;

export type IrisMood =
  | "idle"
  | "working"
  | "search"
  | "happy"
  | "alert"
  | "sad"
  | "nostalgia"
  | "shutter";

export interface Memory {
  id: string;
  cat: CategoryId;
  title: string;
  summary: string;
  ocr: string;
  tags: string[];
  amount?: number;
  locked: boolean;
  date: string; // ISO string
  mood: MoodIndex | null;
  done?: boolean; // per le idee, spuntabili
  /** Data di scadenza (YYYY-MM-DD) rilevata da Iris o inserita a mano. */
  expiry?: string;
}

export type WidgetSize = "S" | "M" | "L";

export interface WidgetInstance {
  id: WidgetId;
  size: WidgetSize;
}

export type WidgetId =
  | "hero"
  | "streak"
  | "recenti"
  | "cerca"
  | "speso"
  | "evento"
  | "vault"
  | "annofa"
  | "umore"
  | "frase"
  | "persone"
  | "idee"
  | "scadenze"
  | "report";

export interface Profile {
  name: string;
  nick: string;
}

export interface AccentColor {
  id: string;
  label: string;
  hex: string;
}

export interface PersistedState {
  profile: Profile | null;
  myCats: CategoryId[];
  widgets: WidgetInstance[];
  items: Memory[];
  streak: number;
  lastSave: string | null;
  pinHash: string | null;
  pinSalt: string | null;
  sounds: boolean;
  answered: string | null;
  plan: Plan;
  accent: string;
  fontLarge: boolean;
  usage: UsageState;
}

/** Contatori d'uso per feature limitate, azzerati al reset del periodo. */
export interface UsageCounter {
  count: number;
  periodStart: string; // ISO della data di inizio periodo (giorno o settimana)
}

export interface UsageState {
  domandeIrisPerGiorno: UsageCounter;
  exportPerSettimana: UsageCounter;
  visionPerGiorno: UsageCounter;
  upgradePromptedOn: string | null; // dayKey dell'ultimo prompt di upgrade mostrato
}

export type LimitedFeature =
  | "memorie"
  | "widget"
  | "domandeIris"
  | "vault"
  | "export"
  | "annofaStorico"
  | "umoreStorico"
  | "accent"
  | "visionAI";

/** Intento della cattura: cosa deve guardare Iris nella foto. */
export type VisionIntent = "scena" | "testo" | "posizione" | "scadenza" | "custom";

/** Risposta strutturata dell'analisi AI di una foto. */
export interface VisionResult {
  title: string;
  description: string;
  category: CategoryId;
  tags: string[];
  amount: number | null;
  expiry: string | null; // YYYY-MM-DD
}

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  limit: number | null; // null = illimitato
  resetAt: Date | null;
}
