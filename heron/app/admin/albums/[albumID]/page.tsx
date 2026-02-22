"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import type { Album, Image as ImageMeta } from "@/lib/api";
import type { SortableImage } from "@/components/SortableImageGrid";
import SortableImageGrid from "@/components/SortableImageGrid";
import { apiFetch, getImages, linkAlbumImage } from "@/lib/api";
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
  const [allImages, setAllImages] = useState<ImageMeta[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [linkSectionOpen, setLinkSectionOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (Number.isNaN(id)) return;
    try {
      const [albumList, imagesData, allImagesData] = await Promise.all([
        apiFetch<Album[]>("/albums"),
        apiFetch<SortableImage[]>(`/albums/${id}/images`),
        getImages()
      ]);
      const a = albumList?.find((x) => x.id === id) ?? null;
      setAlbum(a);
      setImages(Array.isArray(imagesData) ? imagesData : []);
      setAllImages(allImagesData || []);
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

  const handleCropImage = (image: SortableImage) => {
    setCropImageId(image.id);
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

  const handleUpdateImageMetadata = async (image: SortableImage) => {
    // This would typically open a modal or prompt. 
    // For this refactor, we maintain existing callback structure but ensure type safety.
    // In a full implementation, this might prompt for alt_text, caption, etc.
    toast.info("Metadata editing triggered for image: " + (image.name || image.id));
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

  const linkImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      await linkAlbumImage(id, selectedImage, sortOrder);
      setSelectedImage(null);
      setSortOrder(0);
      toast.success("Image linked to album.");
      await fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to link image";
      toast.error(msg);
    } finally {
      setLoading(false);
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
      <article className="card">
        <p className="text-copper">Invalid album id.</p>
        <Link href="/admin/albums" className="btn btn--outline mt-4">Back to Albums</Link>
      </article>
    );
  }

  if (loading) {
    return (
      <article className="card">
        <p className="text-olive dark:text-dark-muted">Loading...</p>
      </article>
    );
  }

  if (!album) {
    return (
      <article className="card">
        <p className="text-copper">Album not found.</p>
        <Link href="/admin/albums" className="btn btn--outline mt-4">
          Back to albums
        </Link>
      </article>
    );
  }

  return (
    <article className="admin-dashboard">
      <header className="section-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-header__title">Manage Album</h1>
          <p className="section-header__desc">Edit album details and manage photos.</p>
        </div>
        <Link href="/admin/albums" className="btn btn--outline">
          Back to albums
        </Link>
      </header>

      <section className="card flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="resume-section__title mb-0 border-none">Album Details</h2>
          <button
            className="btn btn--primary"
            disabled={saving}
            onClick={handleSaveMetadata}
          >
            {saving ? "Saving..." : "Save details"}
          </button>
        </header>

        <form className="admin-form" onSubmit={(e) => e.preventDefault()}>
          <div className="admin-form__row admin-form__row--two-col">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Album title"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input
                className="form-control"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="album-url-slug"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description"
              rows={2}
            />
          </div>
          {error && <p className="text-copper text-sm">{error}</p>}
        </form>
      </section>

      <section className="card flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setAddPhotosOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left group"
        >
          <h2 className="resume-section__title mb-0 border-none">Add Photos</h2>
          <span className="text-sm font-semibold text-copper group-hover:underline">
            {addPhotosOpen ? "Hide" : "Show Upload Options"}
          </span>
        </button>
        {addPhotosOpen && (
          <div className="admin-form">
            <div
              role="button"
              tabIndex={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragOver}
              onDrop={handleDrop}
              className={`dropzone ${extracting ? "dropzone--active" : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.querySelector<HTMLInputElement>("input[type=file]")?.click();
                }
              }}
            >
              <input
                className="dropzone__input"
                type="file"
                multiple
                accept="image/*,.zip"
                onChange={handleFileChange}
                aria-label="Select photos or zip file"
              />
              <p className="dropzone__text">
                {extracting ? "Extracting images from zip..." : "Drag and drop images or zip here, or click to browse"}
              </p>
            </div>

            {(pendingFiles.length > 0 || uploadingFiles.length > 0) && (
              <div className="upload-preview">
                {pendingFiles.map(({ id: pid, preview }) => (
                  <div key={pid} className="upload-preview__item">
                    <Image
                      src={preview}
                      alt="Preview"
                      width={120}
                      height={90}
                      className="upload-preview__image"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removePending(pid)}
                      className="upload-preview__remove"
                      aria-label="Remove"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {uploadingFiles.map(({ id: uid, progress }) => (
                  <div key={uid} className="upload-preview__item">
                    <div className="flex h-[90px] w-full items-center justify-center bg-desert-tan-dark/20 dark:bg-dark-muted/20">
                      <span className="text-sm font-bold text-chestnut-dark dark:text-dark-text">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              {pendingFiles.length > 0 && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={uploadAll}
                >
                  Upload {pendingFiles.length} photo(s)
                </button>
              )}
              {uploadError && <p className="text-copper text-sm m-0">{uploadError}</p>}
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <button
          type="button"
          onClick={() => setLinkSectionOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left group"
        >
          <h2 className="resume-section__title mb-0 border-none">Link Existing Assets</h2>
          <span className="text-sm font-semibold text-copper group-hover:underline">
            {linkSectionOpen ? "Hide" : "Show Gallery Picker"}
          </span>
        </button>
        {linkSectionOpen && (
          <div className="admin-form mt-4">
            <div className="admin-form__row admin-form__row--two-col">
              <div className="form-group">
                <label className="form-label">Select Image</label>
                <select
                  className="form-control"
                  onChange={(e) => setSelectedImage(Number(e.target.value))}
                  value={selectedImage ?? ""}
                >
                  <option value="">Choose an image from vault...</option>
                  {allImages.map((image) => (
                    <option key={image.id} value={image.id}>
                      {image.name || image.caption || image.s3_key}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sort Priority</label>
                <input
                  className="form-control"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="admin-form__actions">
              <button
                className="btn btn--primary"
                onClick={linkImage}
                disabled={!selectedImage || loading}
              >
                Link Image to Album
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <header className="section-header mb-0">
          <h2 className="section-header__title">Gallery Arrangement ({images.length})</h2>
          <p className="section-header__desc">Drag and drop photos to reorder them in the public album.</p>
        </header>

        {images.length === 0 && pendingFiles.length === 0 && uploadingFiles.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-olive dark:text-dark-muted mb-4">No images in this album yet.</p>
            <button onClick={() => setAddPhotosOpen(true)} className="btn btn--outline">
              Upload your first photo
            </button>
          </div>
        ) : (
          <SortableImageGrid
            images={images}
            onReorder={handleReorder}
            onDelete={handleDeleteImage}
            onRotate={handleRotateImage}
            onCrop={handleCropImage}
            onUpdateMetadata={handleUpdateImageMetadata}
          />
        )}
      </section>

      {cropImageId && (() => {
        const img = images.find((i) => i.id === cropImageId);
        const url = img ? `/api/images/${cropImageId}/proxy` : "";
        return img ? (
          <ImageCropModal
            imageUrl={url}
            onCrop={handleCropApply}
            onCancel={() => setCropImageId(null)}
          />
        ) : null;
      })()}
    </article>
  );
}
