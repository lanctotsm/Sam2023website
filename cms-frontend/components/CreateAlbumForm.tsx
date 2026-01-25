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
    <section className="card stack">
      <div className="album-form-header">
        <h2>Create New Album</h2>
        <button className="secondary" onClick={() => setOpen((prev) => !prev)}>
          {open ? "Hide Form" : "Open Form"}
        </button>
      </div>
      {open && (
        <div className="stack">
          <label>Album Name</label>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <label>Slug</label>
          <input
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
          />
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          {error && <p className="error">{error}</p>}
          <button disabled={loading} onClick={submit}>
            {loading ? "Creating..." : "Create Album"}
          </button>
        </div>
      )}
    </section>
  );
}
