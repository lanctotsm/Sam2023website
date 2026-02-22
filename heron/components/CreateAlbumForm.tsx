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

  return (
    <section className="card">
      <header className="section-header">
        <h2 className="section-header__title">Create New Album</h2>
        <p className="section-header__desc">Start by giving your album a title and description.</p>
      </header>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form__row admin-form__row--two-col">
          <div className="form-group">
            <label htmlFor="title" className="form-label">Album Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Summer Vacation 2023"
            />
          </div>

          <div className="form-group">
            <label htmlFor="slug" className="form-label">Slug (URL path)</label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={formData.slug}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. summer-2023"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="form-control"
            placeholder="A brief description of this album..."
          />
        </div>

        <div className="admin-form__actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary"
          >
            {loading ? "Creating..." : "Create Album"}
          </button>
        </div>
      </form>
    </section>
  );
}
