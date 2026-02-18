"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { buildImageUrl } from "@/lib/images";

export type SortableImage = {
  id: number;
  s3_key: string;
  width?: number | null;
  height?: number | null;
  name?: string;
  caption?: string;
  alt_text?: string;
  description?: string;
  tags?: string;
  sort_order: number;
};

type ImageMetadataPatch = {
  name?: string;
  caption?: string;
  alt_text?: string;
  description?: string;
  tags?: string;
};

type Props = {
  images: SortableImage[];
  onReorder: (imageIdsInOrder: number[]) => Promise<void>;
  onDelete?: (imageId: number) => void;
  onRotate?: (imageId: number) => void;
  onCrop?: (imageId: number) => void;
  onUpdateMetadata?: (imageId: number, data: ImageMetadataPatch) => Promise<void>;
  cardClass?: string;
};

function SortableImageItem({
  image,
  cardClass,
  onDelete,
  onRotate,
  onCrop,
  onUpdateMetadata,
  isMetadataOpen,
  onToggleMetadata
}: {
  image: SortableImage;
  cardClass: string;
  onDelete?: (imageId: number) => void;
  onRotate?: (imageId: number) => void;
  onCrop?: (imageId: number) => void;
  onUpdateMetadata?: (imageId: number, data: ImageMetadataPatch) => Promise<void>;
  isMetadataOpen: boolean;
  onToggleMetadata: (imageId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  const [metadata, setMetadata] = useState({
    name: image.name || "",
    caption: image.caption || "",
    alt_text: image.alt_text || "",
    tags: image.tags || "",
    description: image.description || ""
  });
  const [savingMetadata, setSavingMetadata] = useState(false);

  useEffect(() => {
    setMetadata({
      name: image.name || "",
      caption: image.caption || "",
      alt_text: image.alt_text || "",
      tags: image.tags || "",
      description: image.description || ""
    });
  }, [image.name, image.caption, image.alt_text, image.tags, image.description]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-3 ${cardClass} ${isDragging ? "opacity-60 shadow-lg" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing"
        aria-label="Drag to reorder"
        onClick={() => onToggleMetadata(image.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleMetadata(image.id);
          }
        }}
        role={onUpdateMetadata ? "button" : undefined}
        tabIndex={onUpdateMetadata ? 0 : undefined}
      >
        <Image
          src={buildImageUrl(image.s3_key)}
          alt={image.alt_text || image.caption || "Image"}
          width={image.width || 300}
          height={image.height || 200}
          className="block h-[150px] w-full rounded-lg object-cover"
          unoptimized
        />
      </div>
      {(onDelete || onRotate || onCrop) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-xs text-chestnut-dark dark:text-dark-text">
            {onUpdateMetadata ? "Click image to edit metadata" : "Drag image to reorder"}
          </p>
          <div className="flex flex-wrap justify-end gap-1">
          {onRotate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRotate(image.id);
              }}
              className="rounded px-2 py-1 text-xs font-medium text-white transition hover:bg-chestnut/80"
              aria-label="Rotate"
            >
              Rotate
            </button>
          )}
          {onCrop && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCrop(image.id);
              }}
              className="rounded px-2 py-1 text-xs font-medium text-white transition hover:bg-chestnut/80"
              aria-label="Crop"
            >
              Crop
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              className="rounded px-2 py-1 text-xs font-medium text-white transition hover:bg-copper/80"
              aria-label="Delete image"
            >
              Delete
            </button>
          )}
          </div>
        </div>
      )}
      {onUpdateMetadata && isMetadataOpen && (
        <div className="grid gap-2">
          <input
            type="text"
            value={metadata.name}
            onChange={(e) => setMetadata((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-desert-tan-dark bg-white px-2.5 py-2 text-sm text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
            placeholder="Name"
          />
          <input
            type="text"
            value={metadata.tags}
            onChange={(e) => setMetadata((prev) => ({ ...prev, tags: e.target.value }))}
            className="w-full rounded-lg border border-desert-tan-dark bg-white px-2.5 py-2 text-sm text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
            placeholder="Tags (comma-separated hashtags)"
          />
          <input
            type="text"
            value={metadata.alt_text}
            onChange={(e) => setMetadata((prev) => ({ ...prev, alt_text: e.target.value }))}
            className="w-full rounded-lg border border-desert-tan-dark bg-white px-2.5 py-2 text-sm text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
            placeholder="Alt text"
          />
          <input
            type="text"
            value={metadata.caption}
            onChange={(e) => setMetadata((prev) => ({ ...prev, caption: e.target.value }))}
            className="w-full rounded-lg border border-desert-tan-dark bg-white px-2.5 py-2 text-sm text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
            placeholder="Caption"
          />
          <textarea
            value={metadata.description}
            onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-desert-tan-dark bg-white px-2.5 py-2 text-sm text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
            rows={3}
            placeholder="Description"
          />
          <button
            type="button"
            disabled={savingMetadata}
            onClick={async () => {
              setSavingMetadata(true);
              try {
                await onUpdateMetadata(image.id, metadata);
              } finally {
                setSavingMetadata(false);
              }
            }}
            className="rounded-lg border border-chestnut bg-transparent px-3 py-2 text-sm font-medium text-chestnut transition hover:bg-chestnut/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
          >
            {savingMetadata ? "Saving..." : "Save metadata"}
          </button>
        </div>
      )}
    </div>
  );
}

const defaultCardClass =
  "rounded-xl border border-desert-tan-dark bg-surface p-3 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

export default function SortableImageGrid({
  images,
  onReorder,
  onDelete,
  onRotate,
  onCrop,
  onUpdateMetadata,
  cardClass
}: Props) {
  const [items, setItems] = useState<SortableImage[]>(images);
  const [saving, setSaving] = useState(false);
  const [openMetadataImageId, setOpenMetadataImageId] = useState<number | null>(null);
  const resolvedCardClass = cardClass ?? defaultCardClass;

  useEffect(() => {
    setItems(images);
  }, [images]);

  useEffect(() => {
    if (openMetadataImageId === null) return;
    const imageStillExists = images.some((img) => img.id === openMetadataImageId);
    if (!imageStillExists) {
      setOpenMetadataImageId(null);
    }
  }, [images, openMetadataImageId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    setSaving(true);
    try {
      await onReorder(next.map((i) => i.id));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {saving && (
        <p className="col-span-full text-sm text-chestnut-dark dark:text-dark-text">Saving order...</p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.map((image) => (
            <SortableImageItem
              key={image.id}
              image={image}
              cardClass={resolvedCardClass}
              onDelete={onDelete}
              onRotate={onRotate}
              onCrop={onCrop}
              onUpdateMetadata={onUpdateMetadata}
              isMetadataOpen={openMetadataImageId === image.id}
              onToggleMetadata={(imageId) =>
                setOpenMetadataImageId((current) => (current === imageId ? null : imageId))
              }
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
