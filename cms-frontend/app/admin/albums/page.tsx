"use client";

import { useEffect, useState } from "react";
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
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    apiFetch<Album[]>("/albums")
      .then(setAlbums)
      .catch(() => setAlbums([]));
    getImages().then(setImages).catch(() => setImages([]));
  }, []);

  const submit = async () => {
    const created = await createAlbum(form);
    setAlbums((prev) => [created, ...prev]);
    setForm(emptyAlbum);
  };

  const linkImage = async () => {
    if (!selectedAlbum || !selectedImage) {
      return;
    }
    await linkAlbumImage(selectedAlbum, selectedImage, sortOrder);
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Create Album</h2>
        <label>Title</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>Slug</label>
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <label>Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button onClick={submit}>Create Album</button>
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
              {image.s3_key}
            </option>
          ))}
        </select>
        <label>Sort Order</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
        <button onClick={linkImage}>Link Image</button>
      </section>

      <section className="stack">
        <h2>Albums</h2>
        {albums.map((album) => (
          <article className="card" key={album.id}>
            <h3>{album.title}</h3>
            <p>{album.description}</p>
            <p>{album.slug}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
