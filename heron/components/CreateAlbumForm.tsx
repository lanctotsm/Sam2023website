"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Album } from "@/lib/api";
import { toast } from "sonner";

export default function CreateAlbumForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const album = await apiFetch<Album>("/albums", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast.success("Album created successfully!");
      router.push(`/admin/albums/${album.id}`);
    } catch (error) {
      console.error("Failed to create album:", error);
      toast.error("Failed to create album. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && prev.slug === "" ? { slug: value.toLowerCase().replace(/[\s_]+/g, "-").replace(/[^\w-]/g, "") } : {})
    }));
  };

  const inputClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted";
  const labelClass = "text-sm font-medium text-chestnut-dark dark:text-dark-text";

  return (
    <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
      <header className="mb-4">
        <h2 className="text-chestnut dark:text-dark-text">Create New Album</h2>
        <p className="mt-2 text-chestnut-dark dark:text-dark-muted">Start by giving your album a title and description.</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className={labelClass}>Album Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Summer Vacation 2023"
            />
          </div>

          <div>
            <label htmlFor="slug" className={labelClass}>Slug (URL path)</label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={formData.slug}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. summer-2023"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className={inputClass}
            placeholder="A brief description of this album..."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-chestnut px-4 py-2.5 font-semibold text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
          >
            {loading ? "Creating..." : "Create Album"}
          </button>
        </div>
      </form>
    </section>
  );
}
