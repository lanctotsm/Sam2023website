"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import type { Album, Image as ImageMeta } from "@/lib/api";
import { apiFetch, getAlbums } from "@/lib/api";
import { buildThumbUrl } from "@/lib/images";
import { extractImagesFromZip, isZipFile, isFileWithinSizeLimit, MAX_UPLOAD_BYTES } from "@/lib/upload-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

type UploadState = "idle" | "extracting" | "uploading" | "done" | "error";

export default function UploadForm() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState<ImageMeta[]>([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    apiFetch<Album[]>("/albums")
      .then((data) => setAlbums(data || []))
      .catch(() => setAlbums([]));
  }, []);

  const isReady = useMemo(
    () => !!albumId && files.length > 0 && status !== "uploading",
    [albumId, files, status]
  );

  const processSelectedFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setError("");
    setStatus("idle");

    const zipFiles = selectedFiles.filter(isZipFile);
    const imageFiles = selectedFiles.filter((f) => !isZipFile(f));
    let allFiles = [...imageFiles];

    if (zipFiles.length > 0) {
      setStatus("extracting");
      try {
        for (const zipFile of zipFiles) {
          const extracted = await extractImagesFromZip(zipFile);
          allFiles = [...allFiles, ...extracted];
        }
        toast.success(`Extracted ${allFiles.length - imageFiles.length} images from zip file(s)`);
      } catch (err) {
        setError("Failed to extract images from zip file");
        toast.error("Failed to extract images from zip file");
        setStatus("idle");
        return;
      }
    }

    const oversized = allFiles.filter((f) => !isFileWithinSizeLimit(f));
    if (oversized.length > 0) {
      const maxMB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
      setError(`Some files exceed ${maxMB}MB limit: ${oversized.map((f) => f.name).join(", ")}`);
      toast.error(`Max file size is ${maxMB}MB. Remove or resize the oversized file(s).`);
      setStatus("idle");
      return;
    }

    setFiles(allFiles);
    setStatus("idle");
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

  const upload = async () => {
    if (files.length === 0 || !albumId) {
      return;
    }

    const oversized = files.filter((f) => !isFileWithinSizeLimit(f));
    if (oversized.length > 0) {
      const maxMB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
      setError(`Some files exceed ${maxMB}MB limit.`);
      toast.error(`Max file size is ${maxMB}MB.`);
      return;
    }

    setError("");
    setStatus("uploading");
    setUploaded([]);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("album_id", albumId);
    formData.append("caption", caption);
    formData.append("alt_text", altText);
    for (const file of files) {
      formData.append("files", file);
    }

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { images: ImageMeta[] };
            setUploaded(data.images);
            setStatus("done");
            toast.success(`${files.length} photo(s) uploaded successfully`);
            const album = albums.find((a) => a.id === Number(albumId));
            if (album?.slug) {
              router.push(`/albums/${album.slug}`);
            } else {
              router.push("/albums");
            }
          } catch {
            setStatus("error");
            setError("Invalid response");
            toast.error("Upload failed.");
          }
          resolve();
        } else {
          setStatus("error");
          const msg = xhr.responseText || `Upload failed (${xhr.status})`;
          setError(msg);
          toast.error(msg);
          reject(new Error(msg));
        }
      });
      xhr.addEventListener("error", () => {
        setStatus("error");
        setError("Upload failed");
        toast.error("Upload failed.");
        reject(new Error("Upload failed"));
      });
      xhr.open("POST", `${API_BASE}/images/upload`);
      xhr.withCredentials = true;
      xhr.send(formData);
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
        <h1 className="m-0 text-chestnut">Upload Photos</h1>
        <label className={labelClass}>Album</label>
        <select
          className={inputClass}
          value={albumId}
          onChange={(event) => setAlbumId(event.target.value)}
        >
          <option value="">Select an album</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
        <label className={labelClass}>Photos (multiple images or zip file)</label>
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
            multiple
            accept="image/*,.zip"
            onChange={handleFileSelection}
            aria-label="Select photos or zip file"
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
        <input className={inputClass} value={caption} onChange={(event) => setCaption(event.target.value)} />
        <label className={labelClass}>Alt Text (optional, applies to all)</label>
        <input className={inputClass} value={altText} onChange={(event) => setAltText(event.target.value)} />
        
        {status === "extracting" && <p className="text-olive text-sm">Extracting images from zip...</p>}
        {status === "uploading" && (
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
        {status === "done" && <p className="text-olive text-sm">Upload complete!</p>}
        {error && <p className="text-copper text-sm">{error}</p>}
        
        <button
          className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60"
          disabled={!isReady}
          onClick={upload}
        >
          Upload {files.length > 0 ? `${files.length} Photo(s)` : ""}
        </button>
      </section>

      {uploaded.length > 0 && (
        <section className={`${cardClass} flex flex-col gap-4`}>
          <h2 className="m-0 text-chestnut">Uploaded Images ({uploaded.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploaded.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-lg">
                <Image
                  src={buildThumbUrl(img)}
                  alt={img.alt_text || img.caption || "Uploaded image"}
                  width={img.width || 300}
                  height={img.height || 200}
                  className="block w-full h-auto"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
