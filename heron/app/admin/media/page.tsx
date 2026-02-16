"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { Image as ImageMeta } from "@/lib/api";
import { 
  apiFetch, 
  presignImageBatch, 
  createImageBatch 
} from "@/lib/api";
import { buildImageUrl } from "@/lib/images";
import { MediaItemSkeleton } from "@/components/Skeleton";
import { extractImagesFromZip, isZipFile, getImageDimensions } from "@/lib/upload-utils";

type FileUploadProgress = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

export default function AdminMediaPage() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState("");
  const [fileProgress, setFileProgress] = useState<FileUploadProgress[]>([]);

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

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setError("");

    // Check if any file is a zip
    const zipFiles = selectedFiles.filter(isZipFile);
    const imageFiles = selectedFiles.filter(f => !isZipFile(f));

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

    setFiles(allFiles);
    setFileProgress(allFiles.map(f => ({ file: f, status: "pending", progress: 0 })));
    setStatus("");
  };

  const uploadFile = (url: string, contentType: string, fileToUpload: File, index: number) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFileProgress(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], progress, status: "uploading" };
            return updated;
          });
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFileProgress(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: "done", progress: 100 };
            return updated;
          });
          resolve();
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.send(fileToUpload);
    });
  };

  const upload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError("");
    setStatus("Presigning uploads...");

    try {
      const presignData = await presignImageBatch(
        files.map(f => ({
          file_name: f.name,
          content_type: f.type,
          size: f.size
        }))
      );

      setStatus("Uploading to S3...");
      await Promise.all(
        presignData.files.map((presign, index) =>
          uploadFile(presign.upload_url, files[index].type, files[index], index)
        )
      );

      setStatus("Saving metadata...");
      const imageData = await Promise.all(
        files.map(async (file, index) => {
          const dimensions = await getImageDimensions(file);
          return {
            s3_key: presignData.files[index].s3_key,
            caption: caption || "",
            alt_text: altText || "",
            width: dimensions?.width,
            height: dimensions?.height
          };
        })
      );

      const createdImages = await createImageBatch(imageData);

      setImages((prev) => [...createdImages.images, ...prev]);
      setFiles([]);
      setFileProgress([]);
      setCaption("");
      setAltText("");
      setStatus("Upload complete!");
      toast.success(`${files.length} image(s) uploaded.`);

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

  const overallProgress = fileProgress.length > 0
    ? Math.round(fileProgress.reduce((sum, f) => sum + f.progress, 0) / fileProgress.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <section className={`${cardClass} flex flex-col gap-4`}>
        <h2 className="m-0 text-chestnut">Upload New Images</h2>
        <label className={labelClass}>Select Images (multiple or zip file)</label>
        <input
          className="block w-full text-sm text-chestnut-dark file:mr-4 file:rounded-lg file:border-0 file:bg-chestnut file:px-4 file:py-2 file:text-desert-tan"
          type="file"
          accept="image/*,.zip"
          multiple
          onChange={handleFileSelection}
        />
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
        {status && (
          <div className="space-y-2">
            <p className="text-olive text-sm">{status}</p>
            {loading && fileProgress.length > 0 && (
              <>
                <progress className="h-2 w-full rounded-full" value={overallProgress} max={100} />
                <p className="text-xs text-olive">{overallProgress}% complete</p>
              </>
            )}
          </div>
        )}
        {fileProgress.length > 0 && loading && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {fileProgress.map((fp, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-chestnut-dark">{fp.file.name}</span>
                <span className={
                  fp.status === "done" ? "text-olive" :
                  fp.status === "error" ? "text-copper" :
                  fp.status === "uploading" ? "text-chestnut" : "text-olive"
                }>
                  {fp.status === "done" ? "✓" :
                   fp.status === "error" ? "✗" :
                   fp.status === "uploading" ? `${fp.progress}%` : "⏳"}
                </span>
              </div>
            ))}
          </div>
        )}
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
