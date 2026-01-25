"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Album, Image } from "@/lib/api";
import { apiFetch, createAlbum, getImages, linkAlbumImage } from "@/lib/api";

const emptyAlbum = {
  title: "",
  slug: "",
  description: ""
};

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [form, setForm] = useState(emptyAlbum);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [albumsData, imagesData] = await Promise.all([
        apiFetch<Album[]>("/albums"),
        getImages()
      ]);
      setAlbums(albumsData || []);
      setImages(imagesData || []);
    } catch {
      setAlbums([]);
      setImages([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (editingId) {
        const updated = await apiFetch<Album>(`/albums/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        setAlbums((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        setEditingId(null);
      } else {
        const created = await createAlbum(form);
        setAlbums((prev) => [created, ...prev]);
      }
      setForm(emptyAlbum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save album");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (album: Album) => {
    setEditingId(album.id);
    setForm({
      title: album.title,
      slug: album.slug,
      description: album.description || ""
    });
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
    setEditingId(null);
    setForm(emptyAlbum);
    setError("");
  };

  const linkImage = async () => {
    if (!selectedAlbum || !selectedImage) return;
    
    setLoading(true);
    try {
      await linkAlbumImage(selectedAlbum, selectedImage, sortOrder);
      setSelectedImage(null);
      setSortOrder(0);
      alert("Image linked to album successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h2>{editingId ? "Edit Album" : "Create Album"}</h2>
        <label>Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Album title"
        />
        <label>Slug</label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="album-url-slug"
        />
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of the album"
          rows={3}
        />
        {error && <p className="error">{error}</p>}
        <div className="button-row">
          <button disabled={loading} onClick={handleSubmit}>
            {loading ? "Saving..." : editingId ? "Update Album" : "Create Album"}
          </button>
          {editingId && (
            <button className="secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="card stack">
        <h2>Link Image to Album</h2>
        <label>Album</label>
        <select onChange={(e) => setSelectedAlbum(Number(e.target.value))} value={selectedAlbum ?? ""}>
          <option value="">Select album</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
        <label>Image</label>
        <select onChange={(e) => setSelectedImage(Number(e.target.value))} value={selectedImage ?? ""}>
          <option value="">Select image</option>
          {images.map((image) => (
            <option key={image.id} value={image.id}>
              {image.caption || image.s3_key}
            </option>
          ))}
        </select>
        <label>Sort Order</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          placeholder="0"
        />
        <button onClick={linkImage} disabled={!selectedAlbum || !selectedImage || loading}>
          Link Image to Album
        </button>
      </section>

      <section className="stack">
        <h2>All Albums ({albums.length})</h2>
        {albums.length === 0 ? (
          <p className="card muted">No albums yet. Create your first album above.</p>
        ) : (
          <div className="admin-list">
            {albums.map((album) => (
              <article className="card admin-list-item" key={album.id}>
                <div className="admin-list-content">
                  <h3>{album.title}</h3>
                  <p className="muted">{album.description || "No description"}</p>
                  <p className="muted">/{album.slug}</p>
                </div>
                <div className="admin-actions">
                  <Link href={`/albums/${album.slug}`}>
                    <button className="secondary">View</button>
                  </Link>
                  <button className="secondary" onClick={() => handleEdit(album)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => handleDelete(album.id)}>
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
