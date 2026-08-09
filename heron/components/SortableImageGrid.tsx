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
import { applyImageSelection } from "@/lib/imageSelection";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";

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
  cardClass?: string;
}

/**
 * Single thumbnail card: drag handle on the image, selection via click /
 * checkbox, and pencil opens the edit modal without affecting selection.
 */
interface ItemProps {
  image: SortableImage;
  onEdit: (img: SortableImage) => void;
  selected: boolean;
  /** Bubbles modifier keys so the parent can run `applyImageSelection`. */
  onSelect: (id: number, event: React.MouseEvent) => void;
  isOverlay?: boolean;
  cardClass?: string;
}

/**
 * Maps a DOM mouse event into the modifier flags `applyImageSelection` expects.
 * Meta covers Cmd on macOS; Ctrl covers Windows/Linux additive toggle.
 */
function selectionModifiersFromEvent(event: React.MouseEvent): {
  shiftKey: boolean;
  ctrlOrMeta: boolean;
} {
  return {
    shiftKey: event.shiftKey,
    ctrlOrMeta: event.ctrlKey || event.metaKey
  };
}

/**
 * One sortable album photo tile.
 *
 * Intent: let admins select by clicking the image (not only the checkbox)
 * while still dragging to reorder.
 *
 * Implementation: dnd-kit `{...listeners}` live on the image, but a custom
 * `onPointerDown` records the click origin and must forward
 * `listeners.onPointerDown` so drag activation still works.
 * `handleThumbnailClick` skips selection after a real drag; the checkbox uses
 * `onClick` (not `onChange`) so Shift/Ctrl modifiers are present.
 */
function SortableItem({
  image,
  onEdit,
  selected,
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
   * Treat a thumbnail activation as a select only when the pointer barely
   * moved — otherwise this was a reorder drag and selection should no-op.
   */
  const handleThumbnailClick = (event: React.MouseEvent) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (start) {
      const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (distance > CLICK_DRAG_THRESHOLD_PX) return;
    }
    onSelect(image.id, event);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-xl border bg-surface shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:bg-dark-surface ${
        selected
          ? "border-chestnut ring-2 ring-chestnut/40 dark:border-caramel dark:ring-caramel/40"
          : "border-desert-tan-dark dark:border-dark-muted"
      } ${cardClass} ${isDragging || isOverlay ? "opacity-60 shadow-lg" : ""}`}
    >
      <div className="relative">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none active:cursor-grabbing"
          aria-label="Drag to reorder"
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

        <label
          className={`absolute left-2 top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border shadow-sm transition ${
            selected
              ? "border-chestnut bg-chestnut text-desert-tan opacity-100"
              : "border-white/80 bg-white/90 text-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 dark:border-dark-muted dark:bg-dark-surface/90"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {
              /* selection handled in onClick so modifiers are available */
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(image.id, e);
            }}
            className="sr-only"
            aria-label={`Select image ${label || image.id}`}
          />
          <span aria-hidden className="text-xs font-bold leading-none">
            ✓
          </span>
        </label>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(image);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-chestnut shadow-sm opacity-90 transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 dark:border-dark-muted dark:bg-dark-surface/95 dark:text-dark-text dark:hover:bg-dark-bg"
          aria-label="Edit photo"
          title="Edit photo"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </button>
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
 * Admin album gallery: drag-to-reorder plus desktop-style multiselect.
 *
 * Intent: selection works from the thumbnail (click / Ctrl|Cmd / Shift) while
 * reorder remains a short drag on the same surface.
 *
 * Implementation: local `items` mirrors props for optimistic reorder;
 * `lastClickedIdRef` stores the Shift-range anchor; `handleSelect` delegates
 * set math to `applyImageSelection` and pushes both the new Set and anchor
 * back into parent/ref state.
 */
export default function SortableImageGrid({
  images,
  onReorder,
  onEdit,
  selectedIds,
  onSelectionChange,
  cardClass
}: Props) {
  const [items, setItems] = useState<SortableImage[]>(images);
  const [activeId, setActiveId] = useState<number | null>(null);
  /** Last selected image id; Shift+click ranges from here. */
  const lastClickedIdRef = useRef<number | null>(null);

  useEffect(() => {
    setItems(images);
  }, [images]);

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
   * Applies one selection gesture from a thumbnail or checkbox click, then
   * updates parent `selectedIds` and the Shift-range anchor ref.
   */
  const handleSelect = useCallback(
    (id: number, event: React.MouseEvent) => {
      const result = applyImageSelection({
        orderedIds: items.map((img) => img.id),
        selectedIds,
        targetId: id,
        anchorId: lastClickedIdRef.current,
        modifiers: selectionModifiersFromEvent(event)
      });
      onSelectionChange(result.selectedIds);
      lastClickedIdRef.current = result.anchorId;
    },
    [items, onSelectionChange, selectedIds]
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
