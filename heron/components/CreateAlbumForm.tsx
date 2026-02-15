"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAlbum } from "@/lib/api";

type AlbumForm = {
  title: string;
  slug: string;
  description: string;
};

const emptyForm: AlbumForm = {
  title: "",
  slug: "",
  description: ""
};

export default function CreateAlbumForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AlbumForm>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) {
      setError("Album name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await createAlbum(form);
      setForm(emptyForm);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create album.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-4 rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-chestnut dark:text-dark-text">Create New Album</h2>
        <button
          className="rounded-lg border border-chestnut bg-transparent px-4 py-2.5 font-semibold text-chestnut transition-all hover:opacity-90 dark:border-dark-text dark:text-dark-text"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Hide Form" : "Open Form"}
        </button>
      </div>
      {open && (
        <div className="grid gap-4">
          <label className="text-sm font-medium text-olive-dark dark:text-dark-muted">Album Name</label>
          <input
            className="w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark placeholder:text-olive/60 focus:border-chestnut focus:outline-none focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted/60"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <label className="text-sm font-medium text-olive-dark dark:text-dark-muted">Slug</label>
          <input
            className="w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark placeholder:text-olive/60 focus:border-chestnut focus:outline-none focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted/60"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
          />
          <label className="text-sm font-medium text-olive-dark dark:text-dark-muted">Description</label>
          <textarea
            className="min-h-20 w-full resize-y rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark placeholder:text-olive/60 focus:border-chestnut focus:outline-none focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted/60"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          {error && <p className="text-copper dark:text-copper-light">{error}</p>}
          <button
            className="rounded-lg border-none bg-chestnut px-4 py-2.5 font-semibold text-desert-tan transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-chestnut-light dark:text-chestnut-dark"
            disabled={loading}
            onClick={submit}
          >
            {loading ? "Creating..." : "Create Album"}
          </button>
        </div>
      )}
    </section>
  );
}
