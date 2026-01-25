"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Image as ImageMeta } from "@/lib/api";
import { apiFetch, createImage, presignImage } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";

export default function AdminMediaPage() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchImages = async () => {
    try {
      const data = await apiFetch<ImageMeta[]>("/images");
      setImages(data || []);
    } catch {
      setImages([]);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const upload = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setStatus("Presigning upload...");

    try {
      const presign = await presignImage(file.name, file.type, file.size);

      setStatus("Uploading to S3...");
      await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      setStatus("Saving metadata...");
      const metadata = await createImage({
        s3_key: presign.s3_key,
        caption,
        alt_text: altText
      });

      setImages((prev) => [metadata, ...prev]);
      setFile(null);
      setCaption("");
      setAltText("");
      setStatus("Upload complete!");
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await apiFetch(`/images/${imageId}`, { method: "DELETE" });
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Upload New Image</h2>
        <label>Select Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label>Caption</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Image caption"
        />
        <label>Alt Text</label>
        <input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Description for accessibility"
        />
        {error && <p className="error">{error}</p>}
        {status && <p className="muted">{status}</p>}
        <button onClick={upload} disabled={!file || loading}>
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      </section>

      <section className="stack">
        <h2>Media Library ({images.length} images)</h2>
        {images.length === 0 ? (
          <p className="card muted">No images uploaded yet.</p>
        ) : (
          <div className="media-grid">
            {images.map((image) => (
              <div className="card media-item" key={image.id}>
                <div className="media-preview">
                  <Image
                    src={buildImageUrl(image.s3_key)}
                    alt={image.alt_text || image.caption || "Uploaded image"}
                    width={300}
                    height={200}
                    style={{ width: "100%", height: "150px", objectFit: "cover" }}
                    unoptimized
                  />
                </div>
                <div className="media-info">
                  <p className="media-caption">{image.caption || "No caption"}</p>
                  <p className="muted media-key">{image.s3_key}</p>
                </div>
                <button className="danger" onClick={() => handleDelete(image.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
