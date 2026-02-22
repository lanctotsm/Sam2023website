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
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import type { Image as ImageType } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";
import { useState } from "react";
import Image from "next/image";

export type SortableImage = ImageType;

interface Props {
  images: SortableImage[];
  onReorder: (newOrder: number[]) => void;
  onDelete: (imageId: number) => void;
  onRotate: (imageId: number) => void;
  onCrop?: (image: SortableImage) => void;
  onUpdateMetadata?: (image: SortableImage) => void;
  cardClass?: string;
}

interface ItemProps {
  image: SortableImage;
  onDelete: (id: number) => void;
  onRotate: (id: number) => void;
  onCrop?: (img: SortableImage) => void;
  onUpdateMetadata?: (img: SortableImage) => void;
  isOverlay?: boolean;
  cardClass?: string;
}

function SortableItem({
  image,
  onDelete,
  onRotate,
  onCrop,
  onUpdateMetadata,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const itemClasses = `sortable-grid__item ${isDragging ? "sortable-grid__item--dragging" : ""} ${isOverlay ? "sortable-grid__item--overlay" : ""}`;

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-xs text-olive dark:text-dark-muted">
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
              onClick={() => onCrop(image)}
              className="sortable-grid__btn"
              title="Crop image"
              type="button"
            >
              ✂️
            </button>
          )}
          <button
            onClick={() => onDelete(image.id)}
            className="sortable-grid__btn sortable-grid__btn--danger"
            title="Delete image"
            type="button"
          >
            🗑️
          </button>
        </div>

        {onUpdateMetadata && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateMetadata(image);
            }}
            className="btn btn--primary btn--sm mt-auto mb-4"
            type="button"
          >
            Edit Info
          </button>
        )}
      </div>
      {(image.name || image.alt_text) && (
        <div className="sortable-grid__info">
          <p className="truncate m-0">{image.name || image.alt_text}</p>
        </div>
      )}
    </div>
  );
}

export default function SortableImageGrid({
  images,
  onReorder,
  onDelete,
  onRotate,
  onCrop,
  onUpdateMetadata,
  cardClass
}: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const newImages = arrayMove(images, oldIndex, newIndex);
      onReorder(newImages.map(img => img.id));
    }
  }

  const activeImage = activeId ? images.find((img) => img.id === activeId) : null;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
          {images.map((image) => (
            <SortableItem
              key={image.id}
              image={image}
              onDelete={onDelete}
              onRotate={onRotate}
              onCrop={onCrop}
              onUpdateMetadata={onUpdateMetadata}
              cardClass={cardClass}
            />
          ))}
        </SortableContext>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: "0.5"
            }
          }
        })
      }}>
        {activeImage ? (
          <div className="sortable-grid__item sortable-grid__item--dragging">
            <Image
              src={buildImageUrl(activeImage.s3_key)}
              alt=""
              fill
              className="sortable-grid__image"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </div>
  );
}
