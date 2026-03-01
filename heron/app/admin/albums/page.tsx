"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Album } from "@/lib/api";
import { apiFetch, createAlbum } from "@/lib/api";
import { slugify } from "@/lib/slug";

const emptyAlbum = {
  title: "",
  slug: "",
  description: ""
};

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [form, setForm] = useState(emptyAlbum);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const createFormRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const albumsData = await apiFetch<Album[]>("/albums");
      setAlbums(albumsData || []);
    } catch {
      setAlbums([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const created = await createAlbum(form);
      setAlbums((prev) => [created, ...prev]);
      setForm(emptyAlbum);
      setCreateFormOpen(false);
      toast.success("Album created.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save album";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (albumId: number) => {
    if (!confirm("Are you sure you want to delete this album?")) return;

    try {
      await apiFetch(`/albums/${albumId}`, { method: "DELETE" });
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete album");
    }
  };

  const handleCancel = () => {
    setForm(emptyAlbum);
    setError("");
    setCreateFormOpen(false);
  };

  const inputClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted";
  const labelClass = "text-sm font-medium text-chestnut-dark dark:text-dark-text";
  const cardClass =
    "rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

  return (
    <div className="flex flex-col gap-6">
      <section ref={createFormRef} className={cardClass}>
        {createFormOpen ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-chestnut dark:text-dark-text">Create Album</h2>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-8 w-8 items-center justify-center rounded-full text-olive transition-colors hover:bg-olive/5 hover:text-chestnut dark:text-dark-text dark:hover:bg-dark-bg dark:hover:text-caramel-light"
                aria-label="Collapse"
                title="Collapse"
              >
                ▲
              </button>
            </div>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: slugify(title)
                }));
              }}
              placeholder="Album title"
            />
            <label className={labelClass}>Slug</label>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="album-url-slug"
            />
            <label className={labelClass}>Description</label>
            <textarea
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the album"
              rows={3}
            />
            {error && <p className="text-copper text-sm dark:text-copper-light">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Creating..." : "Create Album"}
              </button>
              <button
                className="rounded-lg border border-chestnut bg-transparent px-4 py-2.5 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreateFormOpen(true)}
            className="rounded-lg bg-chestnut px-4 py-2.5 font-medium text-desert-tan transition hover:bg-chestnut-dark dark:text-dark-text"
          >
            Create Album
          </button>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-chestnut dark:text-dark-text">All Albums ({albums.length})</h2>
        {albums.length === 0 ? (
          <p className={`${cardClass} text-chestnut-dark dark:text-dark-text`}>No albums yet. Create your first album above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {albums.map((album) => (
              <article
                className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}
                key={album.id}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-chestnut dark:text-dark-text">{album.title}</h3>
                  <p className="text-chestnut-dark dark:text-dark-text">{album.description || "No description"}</p>
                  <p className="text-olive text-sm dark:text-dark-muted">/{album.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/albums/${album.slug}`}>
                    <button className="rounded-lg border border-chestnut bg-transparent px-3 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg">
                      View
                    </button>
                  </Link>
                  <Link href={`/admin/albums/${album.id}`}>
                    <button className="rounded-lg border border-chestnut bg-transparent px-3 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg">
                      Manage
                    </button>
                  </Link>
                  <button
                    className="rounded-lg border border-copper bg-transparent px-3 py-2 text-copper transition hover:bg-copper/10 dark:border-copper dark:text-copper-light dark:hover:bg-copper/20"
                    onClick={() => handleDelete(album.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
