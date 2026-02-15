"use client";

import { useState } from "react";
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
  caption?: string;
  alt_text?: string;
  sort_order: number;
};

type Props = {
  images: SortableImage[];
  onReorder: (imageIdsInOrder: number[]) => Promise<void>;
  cardClass?: string;
};

function SortableImageItem({
  image,
  cardClass
}: {
  image: SortableImage;
  cardClass: string;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${cardClass} ${isDragging ? "opacity-60 shadow-lg" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing"
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
      {image.caption && (
        <p className="mt-2 truncate text-sm text-chestnut-dark dark:text-dark-text">
          {image.caption}
        </p>
      )}
    </div>
  );
}

const defaultCardClass =
  "rounded-xl border border-desert-tan-dark bg-surface p-3 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

export default function SortableImageGrid({ images, onReorder, cardClass }: Props) {
  const [items, setItems] = useState<SortableImage[]>(images);
  const [saving, setSaving] = useState(false);
  const resolvedCardClass = cardClass ?? defaultCardClass;

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
        <p className="col-span-full text-sm text-olive dark:text-dark-muted">Saving order...</p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.map((image) => (
            <SortableImageItem
              key={image.id}
              image={image}
              cardClass={resolvedCardClass}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
