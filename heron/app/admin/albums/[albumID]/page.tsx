"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import type { Album, Image as ImageMeta } from "@/lib/api";
import type { SortableImage } from "@/components/SortableImageGrid";
import SortableImageGrid from "@/components/SortableImageGrid";
import { apiFetch } from "@/lib/api";
import { buildThumbUrl, buildImageUrl } from "@/lib/images";
import ImageCropModal from "@/components/ImageCropModal";
import {
  extractImagesFromZip,
  isZipFile,
  isFileWithinSizeLimit,
  MAX_UPLOAD_BYTES
} from "@/lib/upload-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

type PendingFile = { id: string; file: File; preview: string };
type UploadingFile = { id: string; file: File; progress: number };

const inputClass =
  "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text";
const labelClass = "text-sm font-medium text-chestnut-dark dark:text-dark-text";
const cardClass =
  "rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

export default function AdminAlbumEditorPage() {
  const params = useParams();
  const id = typeof params.albumID === "string" ? parseInt(params.albumID, 10) : NaN;
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<SortableImage[]>([]);
  const [form, setForm] = useState({ title: "", slug: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [cropImageId, setCropImageId] = useState<number | null>(null);
  const [addPhotosOpen, setAddPhotosOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (Number.isNaN(id)) return;
    try {
      const [albumList, imagesData] = await Promise.all([
        apiFetch<Album[]>("/albums"),
        apiFetch<SortableImage[]>(`/albums/${id}/images`)
      ]);
      const a = albumList?.find((x) => x.id === id) ?? null;
      setAlbum(a);
      setImages(Array.isArray(imagesData) ? imagesData : []);
      if (a) {
        setForm({
          title: a.title,
          slug: a.slug,
          description: a.description ?? ""
        });
      }
    } catch {
      setAlbum(null);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveMetadata = async () => {
    if (!album) return;
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch<Album>(`/albums/${album.id}`, {
        method: "PUT",
        body: JSON.stringify(form)
      });
      setAlbum(updated);
      toast.success("Album updated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save album";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRotateImage = async (imageId: number) => {
    try {
      await apiFetch(`/images/${imageId}/rotate`, {
        method: "PATCH",
        body: JSON.stringify({ rotate: 90 })
      });
      await fetchData();
      toast.success("Image rotated.");
    } catch {
      toast.error("Failed to rotate image.");
    }
  };

  const handleCropImage = (imageId: number) => {
    setCropImageId(imageId);
  };

  const handleCropApply = async (blob: Blob) => {
    if (!cropImageId) return;
    setCropImageId(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, "cropped.jpg");
      const res = await fetch(`${API_BASE}/images/${cropImageId}/replace`, {
        method: "PUT",
        credentials: "include",
        body: formData
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Replace failed (${res.status})`);
      }
      await fetchData();
      toast.success("Image cropped.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to crop image.");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("Delete this image from the album and remove it from storage?")) return;
    try {
      await apiFetch(`/images/${imageId}`, { method: "DELETE" });
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted.");
    } catch {
      toast.error("Failed to delete image.");
    }
  };

  const handleReorder = async (order: number[]) => {
    try {
      await apiFetch(`/albums/${id}/images`, {
        method: "PUT",
        body: JSON.stringify({ order })
      });
      toast.success("Order saved.");
    } catch {
      toast.error("Failed to save order.");
    }
  };

  const handleUpdateImageMetadata = async (
    imageId: number,
    data: {
      name?: string;
      caption?: string;
      alt_text?: string;
      description?: string;
      tags?: string;
    }
  ) => {
    try {
      const updated = await apiFetch<SortableImage>(`/images/${imageId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, ...updated } : img)));
      toast.success("Image metadata updated.");
    } catch {
      toast.error("Failed to update image metadata.");
      throw new Error("Failed to update image metadata.");
    }
  };

  const processSelectedFiles = useCallback(async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setUploadError("");
    const zipFiles = selectedFiles.filter(isZipFile);
    const imageFiles = selectedFiles.filter((f) => !isZipFile(f));
    let allFiles = [...imageFiles];
    if (zipFiles.length > 0) {
      setExtracting(true);
      try {
        for (const zipFile of zipFiles) {
          const extracted = await extractImagesFromZip(zipFile);
          allFiles = [...allFiles, ...extracted];
        }
        toast.success(`Extracted ${allFiles.length - imageFiles.length} images from zip`);
      } catch {
        setUploadError("Failed to extract images from zip");
        toast.error("Failed to extract images from zip");
      } finally {
        setExtracting(false);
      }
    }
    const oversized = allFiles.filter((f) => !isFileWithinSizeLimit(f));
    if (oversized.length > 0) {
      const maxMB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
      setUploadError(`Some files exceed ${maxMB}MB limit`);
      toast.error(`Max file size is ${maxMB}MB`);
      return;
    }
    const pending: PendingFile[] = allFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    setPendingFiles((prev) => [...prev, ...pending]);
    setAddPhotosOpen(true);
  }, []);

  const removePending = (pendingId: string) => {
    setPendingFiles((prev) => {
      const p = prev.find((x) => x.id === pendingId);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter((x) => x.id !== pendingId);
    });
  };

  const uploadAll = async () => {
    if (pendingFiles.length === 0) return;
    setUploadError("");
    const toUpload = [...pendingFiles];
    setPendingFiles([]);
    for (const { id: pendingId, file } of toUpload) {
      const uploadingId = `${pendingId}-uploading`;
      setUploadingFiles((prev) => [...prev, { id: uploadingId, file, progress: 0 }]);
      try {
        const result = await new Promise<{ images: ImageMeta[] }>((resolve, reject) => {
          const formData = new FormData();
          formData.append("album_id", String(id));
          formData.append("files", file);
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploadingFiles((prev) =>
                prev.map((u) => (u.id === uploadingId ? { ...u, progress: pct } : u))
              );
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error("Invalid response"));
              }
            } else {
              reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("POST", `${API_BASE}/images/upload`);
          xhr.withCredentials = true;
          xhr.send(formData);
        });
        setUploadingFiles((prev) => prev.filter((u) => u.id !== uploadingId));
        URL.revokeObjectURL(toUpload.find((x) => x.id === pendingId)?.preview ?? "");
        await fetchData();
        if (result.images?.length) {
          toast.success(`Uploaded ${result.images.length} photo(s)`);
        }
      } catch (err) {
        setUploadingFiles((prev) => prev.filter((u) => u.id !== uploadingId));
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadError(msg);
        toast.error(msg);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processSelectedFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const items = e.dataTransfer?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const f = items[i].getAsFile();
      if (f) files.push(f);
    }
    if (files.length > 0) processSelectedFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (Number.isNaN(id)) {
    return (
      <div className={cardClass}>
        <p className="text-copper">Invalid album id.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cardClass}>
        <p className="text-olive dark:text-dark-muted">Loading...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className={cardClass}>
        <p className="text-copper">Album not found.</p>
        <Link href="/admin/albums" className="mt-2 inline-block text-copper hover:text-chestnut">
          Back to albums
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-chestnut dark:text-dark-text">Manage album</h1>
        <Link
          href="/admin/albums"
          className="rounded-lg border border-chestnut bg-transparent px-4 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text"
        >
          Back to albums
        </Link>
      </div>

      <section className={`${cardClass} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-chestnut dark:text-dark-text">Album details</h2>
          <button
            className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
            disabled={saving}
            onClick={handleSaveMetadata}
          >
            {saving ? "Saving..." : "Save details"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Album title"
            />
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Slug</label>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="album-url-slug"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description"
            rows={2}
          />
        </div>
        {error && <p className="text-copper text-sm">{error}</p>}
      </section>

      <section className={`${cardClass} flex flex-col gap-4`}>
        <button
          type="button"
          onClick={() => setAddPhotosOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="m-0 text-chestnut dark:text-dark-text">Add photos</h2>
          <span className="text-sm text-olive dark:text-dark-muted">
            {addPhotosOpen ? "Hide" : "Show"}
          </span>
        </button>
        {addPhotosOpen && (
          <>
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragOver}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
            extracting ? "border-chestnut bg-chestnut/10" : "border-desert-tan-dark hover:border-chestnut/50 dark:border-dark-muted dark:hover:border-chestnut/50"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.querySelector<HTMLInputElement>("input[type=file]")?.click();
            }
          }}
        >
          <input
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            type="file"
            multiple
            accept="image/*,.zip"
            onChange={handleFileChange}
            aria-label="Select photos or zip file"
          />
          <p className="pointer-events-none m-0 text-sm text-chestnut-dark dark:text-dark-muted">
            {extracting ? "Extracting images from zip..." : "Drag and drop images or zip here, or click to browse"}
          </p>
        </div>
        {(pendingFiles.length > 0 || uploadingFiles.length > 0) && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {pendingFiles.map(({ id: pid, preview }) => (
              <div key={pid} className="group relative overflow-hidden rounded-lg border border-desert-tan-dark dark:border-dark-muted">
                <Image
                  src={preview}
                  alt="Preview"
                  width={120}
                  height={90}
                  className="block h-[90px] w-full object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removePending(pid)}
                  className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove"
                >
                  Remove
                </button>
              </div>
            ))}
            {uploadingFiles.map(({ id: uid, progress }) => (
              <div key={uid} className="overflow-hidden rounded-lg border border-desert-tan-dark dark:border-dark-muted">
                <div className="flex h-[90px] w-full items-center justify-center bg-desert-tan-dark/20 dark:bg-dark-muted/20">
                  <span className="text-sm font-medium text-chestnut-dark dark:text-dark-text">{progress}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-b bg-desert-tan-dark/30 dark:bg-dark-muted/30">
                  <div
                    className="h-full rounded-b bg-chestnut transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {pendingFiles.length > 0 && (
          <button
            type="button"
            className="w-fit rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
            onClick={uploadAll}
          >
            Upload {pendingFiles.length} photo(s)
          </button>
        )}
        {uploadError && <p className="text-copper text-sm">{uploadError}</p>}
          </>
        )}
        {!addPhotosOpen && (pendingFiles.length > 0 || uploadingFiles.length > 0) && (
          <button
            type="button"
            onClick={() => setAddPhotosOpen(true)}
            className="text-sm text-chestnut hover:text-chestnut-dark dark:text-dark-text dark:hover:text-desert-tan"
          >
            Show {pendingFiles.length + uploadingFiles.length} pending · expand to upload
          </button>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-chestnut dark:text-dark-text">Images ({images.length})</h2>
        {images.length === 0 && pendingFiles.length === 0 && uploadingFiles.length === 0 ? (
          <p className={`${cardClass} text-olive dark:text-dark-muted`}>
            No images in this album. Add photos above or link images from the Albums page.
          </p>
        ) : (
          <SortableImageGrid
            images={images}
            onReorder={handleReorder}
            onDelete={handleDeleteImage}
            onRotate={handleRotateImage}
            onCrop={handleCropImage}
            onUpdateMetadata={handleUpdateImageMetadata}
            cardClass={cardClass}
          />
        )}
      </section>

      {cropImageId && (() => {
        const img = images.find((i) => i.id === cropImageId);
        const url = img ? buildImageUrl(img.s3_key) : "";
        return img ? (
          <ImageCropModal
            imageUrl={url}
            onCrop={handleCropApply}
            onCancel={() => setCropImageId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
