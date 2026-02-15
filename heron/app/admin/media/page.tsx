"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { Image as ImageMeta } from "@/lib/api";
import { apiFetch, createImage, presignImage } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";
import { MediaItemSkeleton } from "@/components/Skeleton";

export default function AdminMediaPage() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState("");

  const fetchImages = async () => {
    setLoadingImages(true);
    try {
      const data = await apiFetch<ImageMeta[]>("/images");
      setImages(data || []);
    } catch {
      setImages([]);
    } finally {
      setLoadingImages(false);
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
      toast.success("Image uploaded.");
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      toast.error(msg);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    toast("Are you sure you want to delete this image?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await apiFetch(`/images/${imageId}`, { method: "DELETE" });
            setImages((prev) => prev.filter((img) => img.id !== imageId));
            toast.success("Image deleted.");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delete image";
            setError(msg);
            toast.error(msg);
          }
        }
      },
      cancel: { label: "Cancel", onClick: () => {} }
    });
  };

  const inputClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10";
  const labelClass = "text-sm font-medium text-chestnut-dark";
  const cardClass =
    "rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]";

  return (
    <div className="flex flex-col gap-6">
      <section className={`${cardClass} flex flex-col gap-4`}>
        <h2 className="m-0 text-chestnut">Upload New Image</h2>
        <label className={labelClass}>Select Image</label>
        <input
          className="block w-full text-sm text-chestnut-dark file:mr-4 file:rounded-lg file:border-0 file:bg-chestnut file:px-4 file:py-2 file:text-desert-tan"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label className={labelClass}>Caption</label>
        <input
          className={inputClass}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Image caption"
        />
        <label className={labelClass}>Alt Text</label>
        <input
          className={inputClass}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Description for accessibility"
        />
        {error && <p className="text-copper text-sm">{error}</p>}
        {status && <p className="text-olive text-sm">{status}</p>}
        <button
          className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60"
          onClick={upload}
          disabled={!file || loading}
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-chestnut">Media Library ({images.length} images)</h2>
        {loadingImages ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MediaItemSkeleton key={i} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className={`${cardClass} text-olive`}>No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {images.map((image) => (
              <div className={`${cardClass} flex flex-col gap-3`} key={image.id}>
                <div className="overflow-hidden rounded-lg">
                  <Image
                    src={buildImageUrl(image.s3_key)}
                    alt={image.alt_text || image.caption || "Uploaded image"}
                    width={300}
                    height={200}
                    className="block h-[150px] w-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-medium text-chestnut-dark">{image.caption || "No caption"}</p>
                  <p className="mt-1 truncate text-xs text-olive">{image.s3_key}</p>
                </div>
                <button
                  className="rounded-lg border border-copper bg-transparent px-3 py-2 text-sm text-copper transition hover:bg-copper/10"
                  onClick={() => handleDelete(image.id)}
                >
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
