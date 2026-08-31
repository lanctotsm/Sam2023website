"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Album } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import {
  adminCardClass as cardClass,
  adminInputClass as inputClass,
  adminLabelClass as labelClass
} from "@/lib/admin-ui";

export default function UploadForm() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumId, setAlbumId] = useState("");

  useEffect(() => {
    apiFetch<Album[]>("/albums")
      .then((data) => setAlbums(data || []))
      .catch(() => setAlbums([]));
  }, []);

  const handleGoToAlbum = () => {
    if (!albumId) return;
    router.push(`/admin/albums/${albumId}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className={`${cardClass} flex flex-col gap-4`}>
        <h1 className="m-0 text-chestnut dark:text-dark-text">Upload Photos</h1>
        <p className="text-olive dark:text-dark-muted">
          Choose an album to manage. You can add photos, reorder, rotate, crop, and delete images from the album editor.
        </p>
        <label className={labelClass}>Album</label>
        <select
          className={inputClass}
          value={albumId}
          onChange={(e) => setAlbumId(e.target.value)}
        >
          <option value="">Select an album</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
        <button
          className="w-fit rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"
          disabled={!albumId}
          onClick={handleGoToAlbum}
        >
          Manage album
        </button>
      </section>
    </div>
  );
}
