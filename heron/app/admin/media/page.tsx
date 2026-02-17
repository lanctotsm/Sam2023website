"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { Image as ImageMeta } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import { buildThumbUrl } from "@/lib/images";
import { MediaItemSkeleton } from "@/components/Skeleton";
import { extractImagesFromZip, isZipFile, isFileWithinSizeLimit, MAX_UPLOAD_BYTES } from "@/lib/upload-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function AdminMediaPage() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  const processSelectedFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setError("");

    const zipFiles = selectedFiles.filter(isZipFile);
    const imageFiles = selectedFiles.filter((f) => !isZipFile(f));
    let allFiles = [...imageFiles];

    if (zipFiles.length > 0) {
      setStatus("Extracting images from zip...");
      try {
        for (const zipFile of zipFiles) {
          const extracted = await extractImagesFromZip(zipFile);
          allFiles = [...allFiles, ...extracted];
        }
        toast.success(`Extracted ${allFiles.length - imageFiles.length} images from zip file(s)`);
      } catch (err) {
        setError("Failed to extract images from zip file");
        toast.error("Failed to extract images from zip file");
        setStatus("");
        return;
      }
    }

    const oversized = allFiles.filter((f) => !isFileWithinSizeLimit(f));
    if (oversized.length > 0) {
      const maxMB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
      setError(`Some files exceed ${maxMB}MB limit: ${oversized.map((f) => f.name).join(", ")}`);
      toast.error(`Max file size is ${maxMB}MB. Remove or resize the oversized file(s).`);
      setStatus("");
      return;
    }

    setFiles(allFiles);
    setStatus("");
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await processSelectedFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const items = e.dataTransfer?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i];
      if (entry.kind === "file") {
        const file = entry.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length === 0) return;
    await processSelectedFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const upload = () => {
    if (files.length === 0) return;

    const oversized = files.filter((f) => !isFileWithinSizeLimit(f));
    if (oversized.length > 0) {
      const maxMB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
      setError(`Some files exceed ${maxMB}MB limit.`);
      toast.error(`Max file size is ${maxMB}MB.`);
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Uploading...");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("alt_text", altText);
    for (const file of files) {
      formData.append("files", file);
    }

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      setLoading(false);
      setStatus("");
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { images: ImageMeta[] };
          setImages((prev) => [...data.images, ...prev]);
          setFiles([]);
          setCaption("");
          setAltText("");
          toast.success(`${data.images.length} image(s) uploaded.`);
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        } catch {
          setError("Invalid response");
          toast.error("Upload failed.");
        }
      } else {
        setError(xhr.responseText || `Upload failed (${xhr.status})`);
        toast.error("Upload failed.");
      }
    });
    xhr.addEventListener("error", () => {
      setLoading(false);
      setStatus("");
      setError("Upload failed");
      toast.error("Upload failed.");
    });
    xhr.open("POST", `${API_BASE}/images/upload`);
    xhr.withCredentials = true;
    xhr.send(formData);
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
        <h2 className="m-0 text-chestnut">Upload New Images</h2>
        <label className={labelClass}>Select Images (multiple or zip file)</label>
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? "border-chestnut bg-chestnut/10"
              : "border-desert-tan-dark bg-surface hover:border-chestnut/50"
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
            accept="image/*,.zip"
            multiple
            onChange={handleFileSelection}
            aria-label="Select images or zip file"
          />
          <p className="pointer-events-none m-0 text-sm text-chestnut-dark">
            {isDragging ? "Drop images or zip here" : "Drag and drop images or zip here, or click to browse"}
          </p>
        </div>
        {files.length > 0 && (
          <p className="text-sm text-olive">
            {files.length} file(s) selected
          </p>
        )}
        <label className={labelClass}>Caption (optional, applies to all)</label>
        <input
          className={inputClass}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Image caption"
        />
        <label className={labelClass}>Alt Text (optional, applies to all)</label>
        <input
          className={inputClass}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Description for accessibility"
        />
        {error && <p className="text-copper text-sm">{error}</p>}
        {loading && (
          <div className="space-y-2">
            <p className="text-olive text-sm">Uploading {files.length} file(s)...</p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-desert-tan-dark/30">
              <div
                className="h-full rounded-full bg-chestnut transition-[width] duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs font-medium text-chestnut-dark">{uploadProgress}%</p>
          </div>
        )}
        {status && !loading && <p className="text-olive text-sm">{status}</p>}
        <button
          className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60"
          onClick={upload}
          disabled={files.length === 0 || loading}
        >
          {loading ? "Uploading..." : `Upload ${files.length > 0 ? `${files.length} Image(s)` : "Images"}`}
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
                    src={buildThumbUrl(image)}
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
