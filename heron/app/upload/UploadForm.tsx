"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import type { Album, Image as ImageMeta } from "@/lib/api";
import { 
  apiFetch, 
  getAlbums, 
  presignImage, 
  presignImageBatch,
  createImageBatch,
  linkAlbumImage 
} from "@/lib/api";
import { buildImageUrl } from "@/lib/images";
import { extractImagesFromZip, isZipFile, getImageDimensions } from "@/lib/upload-utils";

type UploadState = "idle" | "extracting" | "presigning" | "uploading" | "saving" | "done" | "error";

type FileUploadProgress = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

export default function UploadForm() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState<UploadState>("idle");
  const [fileProgress, setFileProgress] = useState<FileUploadProgress[]>([]);
  const [uploaded, setUploaded] = useState<ImageMeta[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Album[]>("/albums")
      .then((data) => setAlbums(data || []))
      .catch(() => setAlbums([]));
  }, []);

  const isReady = useMemo(
    () => !!albumId && files.length > 0 && status !== "uploading" && status !== "presigning",
    [albumId, files, status]
  );

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setError("");
    setStatus("idle");

    // Check if any file is a zip
    const zipFiles = selectedFiles.filter(isZipFile);
    const imageFiles = selectedFiles.filter(f => !isZipFile(f));

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

    setFiles(allFiles);
    setFileProgress(allFiles.map(f => ({ file: f, status: "pending", progress: 0 })));
    setStatus("idle");
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
          setFileProgress(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: "error", error: `Upload failed (${xhr.status})` };
            return updated;
          });
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      });
      xhr.addEventListener("error", () => {
        setFileProgress(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: "error", error: "Upload failed" };
          return updated;
        });
        reject(new Error("Upload failed"));
      });
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.send(fileToUpload);
    });
  };

  const upload = async () => {
    if (files.length === 0 || !albumId) {
      return;
    }

    setError("");
    setStatus("presigning");
    setUploaded([]);

    try {
      // Presign all files
      const presignData = await presignImageBatch(
        files.map(f => ({
          file_name: f.name,
          content_type: f.type,
          size: f.size
        }))
      );

      // Upload all files to S3
      setStatus("uploading");
      await Promise.all(
        presignData.files.map((presign, index) => 
          uploadFile(presign.upload_url, files[index].type, files[index], index)
        )
      );

      // Get dimensions and create metadata for all files
      setStatus("saving");
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

      // Link all images to the album
      await Promise.all(
        createdImages.images.map((img, index) => 
          linkAlbumImage(Number(albumId), img.id, index)
        )
      );

      setUploaded(createdImages.images);
      setStatus("done");
      toast.success(`${files.length} photo(s) uploaded successfully`);
      
      const album = albums.find((a) => a.id === Number(albumId));
      if (album?.slug) {
        router.push(`/albums/${album.slug}`);
      } else {
        router.push("/albums");
      }
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setError(msg);
      toast.error(msg);
    }
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
        <input
          className="block w-full text-sm text-chestnut-dark file:mr-4 file:rounded-lg file:border-0 file:bg-chestnut file:px-4 file:py-2 file:text-desert-tan"
          type="file"
          multiple
          accept="image/*,.zip"
          onChange={handleFileSelection}
        />
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
        {status === "presigning" && <p className="text-olive text-sm">Preparing upload...</p>}
        {status === "uploading" && (
          <div className="space-y-2">
            <p className="text-olive text-sm">Uploading {files.length} file(s)...</p>
            <progress className="h-2 w-full rounded-full" value={overallProgress} max={100} />
            <p className="text-xs text-olive">{overallProgress}% complete</p>
          </div>
        )}
        {status === "saving" && <p className="text-olive text-sm">Saving metadata...</p>}
        {status === "done" && <p className="text-olive text-sm">Upload complete!</p>}
        {error && <p className="text-copper text-sm">{error}</p>}
        
        {fileProgress.length > 0 && status === "uploading" && (
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
                  src={buildImageUrl(img.s3_key)}
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
