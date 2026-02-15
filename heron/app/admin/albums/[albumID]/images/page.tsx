"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import type { Album } from "@/lib/api";
import type { SortableImage } from "@/components/SortableImageGrid";
import SortableImageGrid from "@/components/SortableImageGrid";
import { apiFetch } from "@/lib/api";

export default function AdminAlbumImagesPage() {
  const params = useParams();
  const id = typeof params.albumID === "string" ? parseInt(params.albumID, 10) : NaN;
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<SortableImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [albumList, imagesData] = await Promise.all([
          apiFetch<Album[]>("/albums"),
          apiFetch<SortableImage[]>(`/albums/${id}/images`)
        ]);
        if (cancelled) return;
        const a = albumList.find((a) => a.id === id);
        setAlbum(a || null);
        setImages(Array.isArray(imagesData) ? imagesData : []);
      } catch {
        if (!cancelled) setImages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleReorder = async (order: number[]) => {
    try {
      await apiFetch(`/albums/${id}/images`, {
        method: "PUT",
        body: JSON.stringify({ order })
      });
      toast.success("Order saved.");
    } catch {
      toast.error("Failed to save order.");
    }
  };

  if (Number.isNaN(id)) {
    return (
      <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 dark:border-dark-muted dark:bg-dark-surface">
        <p className="text-copper">Invalid album id.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 dark:border-dark-muted dark:bg-dark-surface">
        <p className="text-olive">Loading...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 dark:border-dark-muted dark:bg-dark-surface">
        <p className="text-copper">Album not found.</p>
        <Link href="/admin/albums" className="mt-2 inline-block text-copper hover:text-chestnut">
          Back to albums
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-chestnut dark:text-dark-text">Order images: {album.title}</h1>
          <p className="text-olive dark:text-dark-muted">Drag to reorder. Changes save automatically.</p>
        </div>
        <Link
          href="/admin/albums"
          className="rounded-lg border border-chestnut bg-transparent px-4 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text"
        >
          Back to albums
        </Link>
      </div>
      {images.length === 0 ? (
        <p className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-olive dark:border-dark-muted dark:bg-dark-surface dark:text-dark-muted">
          No images in this album. Link images from the Albums page.
        </p>
      ) : (
        <SortableImageGrid images={images} onReorder={handleReorder} />
      )}
    </div>
  );
}
