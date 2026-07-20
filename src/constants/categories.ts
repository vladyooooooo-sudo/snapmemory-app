import {
  ReceiptText,
  MapPin,
  CalendarDays,
  KeyRound,
  Lightbulb,
  Users,
  PackageSearch,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "../types";

export interface CategoryMeta {
  label: string;
  Icon: LucideIcon;
  tint: string;
}

export const CATS: Record<CategoryId, CategoryMeta> = {
  spesa: { label: "Spesa", Icon: ReceiptText, tint: "text-amber-300" },
  luogo: { label: "Luogo", Icon: MapPin, tint: "text-emerald-300" },
  evento: { label: "Evento", Icon: CalendarDays, tint: "text-indigo-300" },
  segreto: { label: "Riservato", Icon: KeyRound, tint: "text-rose-300" },
  idea: { label: "Idea", Icon: Lightbulb, tint: "text-fuchsia-300" },
  persona: { label: "Persona", Icon: Users, tint: "text-sky-300" },
  posizione: { label: "Posizione", Icon: PackageSearch, tint: "text-teal-300" },
};

export const CATEGORY_IDS = Object.keys(CATS) as CategoryId[];
