import { useRef, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { SPAN, WIDGET_META } from "../constants/widgets";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import type { WidgetInstance, WidgetSize } from "../types";

interface WidgetGridProps {
  widgets: WidgetInstance[];
  renderWidget: (id: WidgetInstance["id"]) => ReactNode;
  onReorderByIds: (activeId: string, overId: string) => void;
  onMove: (id: WidgetInstance["id"], dir: -1 | 1) => void;
  onResize: (id: WidgetInstance["id"], size: WidgetSize) => void;
  onRemove: (id: WidgetInstance["id"]) => void;
  menuFor: string | null;
  setMenuFor: (id: string | null) => void;
}

function SortableWidget({
  w,
  index,
  total,
  renderWidget,
  onMove,
  onResize,
  onRemove,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: {
  w: WidgetInstance;
  index: number;
  total: number;
  renderWidget: (id: WidgetInstance["id"]) => ReactNode;
  onMove: (id: WidgetInstance["id"], dir: -1 | 1) => void;
  onResize: (id: WidgetInstance["id"], size: WidgetSize) => void;
  onRemove: (id: WidgetInstance["id"]) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: w.id });
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, onCloseMenu, menuOpen);

  const meta = WIDGET_META[w.id];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${SPAN[w.size]} relative rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/[.05] transition ${
        isDragging ? "opacity-60 ring-amber-300/40" : ""
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Trascina per riordinare ${meta.name}`}
          className="cursor-grab touch-none rounded p-0.5 text-white/35 hover:text-white/60 focus-visible:ring-2 focus-visible:ring-amber-300/70"
        >
          <GripVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <span className="text-[11px] uppercase tracking-[.14em] text-white/55">{meta.name}</span>

        {/* Alternativa da tastiera al drag&drop, sempre visibile agli screen reader */}
        <button
          onClick={() => onMove(w.id, -1)}
          disabled={index === 0}
          aria-label={`Sposta ${meta.name} su`}
          className="ml-auto min-h-8 min-w-8 rounded-full p-1 text-white/35 transition hover:bg-white/[.07] hover:text-white/60 disabled:opacity-25"
        >
          <ChevronUp className="mx-auto h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <button
          onClick={() => onMove(w.id, 1)}
          disabled={index === total - 1}
          aria-label={`Sposta ${meta.name} giù`}
          className="min-h-8 min-w-8 rounded-full p-1 text-white/35 transition hover:bg-white/[.07] hover:text-white/60 disabled:opacity-25"
        >
          <ChevronDown className="mx-auto h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <button
          onClick={onToggleMenu}
          aria-label={`Altre opzioni per ${meta.name}`}
          aria-expanded={menuOpen}
          className="min-h-8 min-w-8 rounded-full p-1 text-white/35 transition hover:bg-white/[.07] hover:text-white/60"
        >
          <MoreHorizontal className="mx-auto h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          className="sm-rise absolute right-3 top-11 z-20 w-40 rounded-2xl border border-white/10 bg-[#0e0e15] p-2 shadow-2xl"
        >
          <p className="px-2 py-1 text-[10px] uppercase tracking-[.14em] text-white/45">Taglia</p>
          <div className="flex gap-1 px-1 pb-1">
            {(["S", "M", "L"] as WidgetSize[]).map((s) => (
              <button
                key={s}
                onClick={() => onResize(w.id, s)}
                className={`min-h-9 flex-1 rounded-xl text-sm ${
                  w.size === s ? "bg-white text-[#08080A] font-medium" : "bg-white/[.05] text-white/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => onRemove(w.id)}
            className="flex min-h-9 w-full items-center gap-2 rounded-xl px-2 text-sm text-rose-300/90 transition hover:bg-rose-400/10"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Rimuovi
          </button>
        </div>
      )}

      {renderWidget(w.id)}
    </div>
  );
}

/**
 * Riordino widget touch-friendly con @dnd-kit (pointer + keyboard sensor),
 * al posto delle API HTML5 Drag and Drop native che su iOS/Android via
 * touch non si attivavano. Essendo basato su pointer events dedicati e non
 * sugli eventi drag/drop nativi, non entra più in conflitto con l'import di
 * file via drag&drop (gestito a parte su window, solo per drag di File).
 */
export function WidgetGrid({
  widgets,
  renderWidget,
  onReorderByIds,
  onMove,
  onResize,
  onRemove,
  menuFor,
  setMenuFor,
}: WidgetGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) onReorderByIds(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {widgets.map((w, i) => (
            <SortableWidget
              key={w.id}
              w={w}
              index={i}
              total={widgets.length}
              renderWidget={renderWidget}
              onMove={onMove}
              onResize={onResize}
              onRemove={onRemove}
              menuOpen={menuFor === w.id}
              onToggleMenu={() => setMenuFor(menuFor === w.id ? null : w.id)}
              onCloseMenu={() => setMenuFor(null)}
            />
          ))}
        </section>
      </SortableContext>
    </DndContext>
  );
}
