"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import type { Image as ImageType } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";
import { applyImageSelection, type SelectionModifiers } from "@/lib/imageSelection";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type SortableImage = ImageType;

/**
 * Shared pixel threshold for “click vs drag” on a thumbnail.
 * PointerSensor uses this so DnD does not steal short clicks; the item also
 * ignores click selection when the pointer moved farther than this distance.
 */
const CLICK_DRAG_THRESHOLD_PX = 8;

/** Controlled props for the reorderable, multi-select album grid. */
interface Props {
  images: SortableImage[];
  onReorder: (newOrder: number[]) => void;
  onEdit: (image: SortableImage) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  /** Bumped by the parent when Clear / Select all resets selection externally. */
  selectionEpoch?: number;
  cardClass?: string;
}

/**
 * Single thumbnail card: drag handle on the image, plain click opens edit,
 * modifier-click updates multiselect. Selected tiles show a check; unselected
 * tiles show no checkbox.
 */
interface ItemProps {
  image: SortableImage;
  onEdit: (img: SortableImage) => void;
  selected: boolean;
  /** Shift-range endpoint marker: start, end, both (single-item range), or neither. */
  rangeRole: "start" | "end" | "start-end" | "start-pending" | null;
  onSelect: (id: number, modifiers: SelectionModifiers) => void;
  isOverlay?: boolean;
  cardClass?: string;
}

/**
 * Maps a DOM mouse event into the modifier flags `applyImageSelection` expects.
 * Meta covers Cmd on macOS; Ctrl covers Windows/Linux additive toggle.
 */
function selectionModifiersFromEvent(event: React.MouseEvent): SelectionModifiers {
  return {
    shiftKey: event.shiftKey,
    ctrlOrMeta: event.ctrlKey || event.metaKey
  };
}

/**
 * One sortable album photo tile.
 *
 * Intent: plain click opens the edit modal; Ctrl/Cmd toggles selection;
 * Shift uses a two-click start/end range; drag reorders.
 *
 * Implementation: dnd-kit `{...listeners}` live on the image, but a custom
 * `onPointerDown` records the click origin and must forward
 * `listeners.onPointerDown` so drag activation still works. A check badge is
 * rendered only while selected (no empty unchecked box).
 */
function SortableItem({
  image,
  onEdit,
  selected,
  rangeRole,
  onSelect,
  isOverlay,
  cardClass = ""
}: ItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.id });

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const label = image.name || image.caption || null;

  /**
   * Short pointer travel → edit (plain click) or multiselect (modifiers).
   * Longer travel → drag reorder already handled by dnd-kit; no-op here.
   */
  const handleThumbnailClick = (event: React.MouseEvent) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (start) {
      const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (distance > CLICK_DRAG_THRESHOLD_PX) return;
    }

    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      onSelect(image.id, selectionModifiersFromEvent(event));
      return;
    }

    onEdit(image);
  };

  const rangeBadge =
    rangeRole === "start" || rangeRole === "start-pending"
      ? { text: "Start", pending: rangeRole === "start-pending" }
      : rangeRole === "end"
        ? { text: "End", pending: false }
        : rangeRole === "start-end"
          ? { text: "Start/End", pending: false }
          : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-xl border bg-surface shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:bg-dark-surface ${
        selected
          ? "border-chestnut ring-2 ring-chestnut/40 dark:border-caramel dark:ring-caramel/40"
          : "border-desert-tan-dark dark:border-dark-muted"
      } ${
        rangeRole === "start-pending"
          ? "ring-2 ring-dashed ring-chestnut dark:ring-caramel"
          : ""
      } ${cardClass} ${isDragging || isOverlay ? "opacity-60 shadow-lg" : ""}`}
    >
      <div className="relative">
        <div
          {...attributes}
          {...listeners}
          className="cursor-pointer touch-none active:cursor-grabbing"
          aria-label={`Edit photo${label ? ` ${label}` : ""}. Drag to reorder. Shift+click start/end for a range; Ctrl/Cmd+click to add or remove.`}
          onPointerDown={(event) => {
            pointerStartRef.current = { x: event.clientX, y: event.clientY };
            listeners?.onPointerDown?.(event);
          }}
          onClick={handleThumbnailClick}
        >
          <Image
            src={buildImageUrl(image.s3_key)}
            alt={image.alt_text || image.caption || "Image"}
            width={image.width || 300}
            height={image.height || 200}
            className="block h-[160px] w-full object-cover"
            unoptimized
          />
        </div>

        {rangeBadge && (
          <span
            className={`pointer-events-none absolute left-2 top-2 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
              rangeBadge.pending
                ? "bg-chestnut text-desert-tan dark:bg-caramel dark:text-chestnut-dark"
                : "bg-chestnut/95 text-desert-tan dark:bg-caramel dark:text-chestnut-dark"
            }`}
          >
            {rangeBadge.text}
          </span>
        )}

        {selected && !rangeBadge && (
          <span
            className="pointer-events-none absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-chestnut bg-chestnut text-desert-tan shadow-sm dark:border-caramel dark:bg-caramel dark:text-chestnut-dark"
            aria-hidden
          >
            <span className="text-xs font-bold leading-none">✓</span>
          </span>
        )}

        {selected && rangeBadge && (
          <span
            className="pointer-events-none absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-chestnut bg-chestnut text-desert-tan shadow-sm dark:border-caramel dark:bg-caramel dark:text-chestnut-dark"
            aria-hidden
          >
            <span className="text-xs font-bold leading-none">✓</span>
          </span>
        )}
      </div>

      {label && (
        <div className="min-w-0 px-2.5 py-2">
          <p className="m-0 truncate text-xs text-olive-dark dark:text-dark-muted">{label}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Admin album gallery: drag-to-reorder, click-to-edit, and modifier multiselect.
 *
 * Intent: plain click opens edit; Shift+click #1 starts a range (clears),
 * Shift+click #2 closes it; Ctrl/Cmd toggles without clearing.
 *
 * Implementation: `pendingShiftStartId` + `rangeStartId`/`rangeEndId` come from
 * `applyImageSelection`. Parent Clear/Select all bumps `selectionEpoch` so
 * pending/range markers reset with the controlled selection.
 */
export default function SortableImageGrid({
  images,
  onReorder,
  onEdit,
  selectedIds,
  onSelectionChange,
  selectionEpoch = 0,
  cardClass
}: Props) {
  const [items, setItems] = useState<SortableImage[]>(images);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [pendingShiftStartId, setPendingShiftStartId] = useState<number | null>(null);
  const [rangeStartId, setRangeStartId] = useState<number | null>(null);
  const [rangeEndId, setRangeEndId] = useState<number | null>(null);

  useEffect(() => {
    setItems(images);
  }, [images]);

  useEffect(() => {
    setPendingShiftStartId(null);
    setRangeStartId(null);
    setRangeEndId(null);
  }, [selectionEpoch]);

  useEffect(() => {
    if (selectedIds.size === 0) {
      setPendingShiftStartId(null);
      setRangeStartId(null);
      setRangeEndId(null);
    }
  }, [selectedIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: CLICK_DRAG_THRESHOLD_PX
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  /**
   * Applies one selection gesture, then updates parent selection and local
   * Shift-range start/end markers.
   */
  const handleSelect = useCallback(
    (id: number, modifiers: SelectionModifiers) => {
      const result = applyImageSelection({
        orderedIds: items.map((img) => img.id),
        selectedIds,
        targetId: id,
        pendingShiftStartId,
        modifiers
      });
      onSelectionChange(result.selectedIds);
      setPendingShiftStartId(result.pendingShiftStartId);
      setRangeStartId(result.rangeStartId);
      setRangeEndId(result.rangeEndId);
    },
    [items, onSelectionChange, pendingShiftStartId, selectedIds]
  );

  /** Tracks the active drag id so DragOverlay can mirror the moving card. */
  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  /**
   * Commits a successful drop by reordering local `items` and notifying the
   * parent with the new id sequence (no-op if dropped on self / invalid over).
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((img) => img.id === active.id);
    const newIndex = items.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    onReorder(newItems.map((img) => img.id));
  }

  const activeImage = activeId ? items.find((img) => img.id === activeId) : null;

  function rangeRoleFor(id: number): ItemProps["rangeRole"] {
    if (pendingShiftStartId === id) return "start-pending";
    if (rangeStartId != null && rangeEndId != null && rangeStartId === rangeEndId) {
      return rangeStartId === id ? "start-end" : null;
    }
    if (rangeStartId === id && rangeEndId != null) return "start";
    if (rangeEndId === id) return "end";
    return null;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.map((image) => (
            <SortableItem
              key={image.id}
              image={image}
              onEdit={onEdit}
              selected={selectedIds.has(image.id)}
              rangeRole={rangeRoleFor(image.id)}
              onSelect={handleSelect}
              cardClass={cardClass}
            />
          ))}
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "0.5"
                }
              }
            })
          }}
        >
          {activeImage ? (
            <div className="relative h-[160px] w-[180px] overflow-hidden rounded-xl border border-desert-tan-dark bg-surface shadow-lg dark:border-dark-muted dark:bg-dark-surface">
              <Image
                src={buildImageUrl(activeImage.s3_key)}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
