import type { WidgetId, WidgetSize } from "../types";

export interface WidgetMeta {
  name: string;
  desc: string;
  size: WidgetSize;
}

export const WIDGET_META: Record<WidgetId, WidgetMeta> = {
  hero: { name: "Ricordo di oggi", desc: "Iris e lo scatto quotidiano. Il cuore dell'app.", size: "L" },
  streak: { name: "Streak", desc: "I tuoi giorni di fila, senza ansia.", size: "S" },
  recenti: { name: "Ultimi ricordi", desc: "Le 4 card più recenti.", size: "L" },
  cerca: { name: "Cerca rapida", desc: "Chiedi a Iris, sempre a portata.", size: "M" },
  speso: { name: "Speso questo mese", desc: "Somma vera dei tuoi scontrini.", size: "S" },
  evento: { name: "Prossimo impegno", desc: "L'ultimo evento salvato, in evidenza.", size: "M" },
  vault: { name: "Cassaforte", desc: "Le cose riservate, dietro il tuo PIN.", size: "S" },
  annofa: { name: "Un anno fa", desc: "Appare da solo quando avrà qualcosa da dirti.", size: "M" },
  umore: { name: "Umore del mese", desc: "Le emoji dei tuoi scatti, in colonnine.", size: "M" },
  frase: { name: "Frase di oggi", desc: "Una micro-domanda al giorno: un ricordo senza foto.", size: "M" },
  persone: { name: "Persone", desc: "I volti (iniziali) della tua vita.", size: "M" },
  idee: { name: "Idee in sospeso", desc: "Da provare → fatto, con un tocco.", size: "M" },
};

export const SPAN: Record<WidgetSize, string> = {
  S: "col-span-2 sm:col-span-1",
  M: "col-span-2",
  L: "col-span-2 sm:col-span-4",
};

export const WIDGET_IDS = Object.keys(WIDGET_META) as WidgetId[];
