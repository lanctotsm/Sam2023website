"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import type { Album, Image as ImageMeta } from "@/lib/api";
import { apiFetch, createImage, getAlbums, presignImage, linkAlbumImage } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";

type UploadState = "idle" | "presigning" | "uploading" | "saving" | "done" | "error";

function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const preview = new window.Image();
    const url = URL.createObjectURL(file);
    preview.onload = () => {
      resolve({ width: preview.width, height: preview.height });
      URL.revokeObjectURL(url);
    };
    preview.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    preview.src = url;
  });
}

export default function UploadForm() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<ImageMeta | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Album[]>("/albums")
      .then((data) => setAlbums(data || []))
      .catch(() => setAlbums([]));
  }, []);

  const isReady = useMemo(() => !!albumId && !!file && status !== "uploading", [albumId, file, status]);

  const uploadFile = (url: string, contentType: string, fileToUpload: File) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
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
    if (!file || !albumId) {
      return;
    }

    setError("");
    setStatus("presigning");
    setProgress(0);
    setUploaded(null);
    setPublicUrl("");

    try {
      const presign = await presignImage(file.name, file.type, file.size);
      setPublicUrl(presign.public_url);

      setStatus("uploading");
      await uploadFile(presign.upload_url, file.type, file);

      setStatus("saving");
      const dimensions = await getImageDimensions(file);
      const metadata = await createImage({
        s3_key: presign.s3_key,
        caption,
        alt_text: altText,
        width: dimensions?.width,
        height: dimensions?.height
      });

      await linkAlbumImage(Number(albumId), metadata.id, 0);

      setUploaded(metadata);
      setStatus("done");
      toast.success("Photo uploaded.");
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

  return (
    <div className="flex flex-col gap-6">
      <section className={`${cardClass} flex flex-col gap-4`}>
        <h1 className="m-0 text-chestnut">Upload Photo</h1>
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
        <label className={labelClass}>Photo</label>
        <input
          className="block w-full text-sm text-chestnut-dark file:mr-4 file:rounded-lg file:border-0 file:bg-chestnut file:px-4 file:py-2 file:text-desert-tan"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <label className={labelClass}>Caption</label>
        <input className={inputClass} value={caption} onChange={(event) => setCaption(event.target.value)} />
        <label className={labelClass}>Alt Text</label>
        <input className={inputClass} value={altText} onChange={(event) => setAltText(event.target.value)} />
        {status === "uploading" && (
          <progress className="h-2 w-full rounded-full" value={progress} max={100} />
        )}
        {status !== "idle" && status !== "uploading" && <p className="text-olive text-sm">{status}</p>}
        {error && <p className="text-copper text-sm">{error}</p>}
        <button
          className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60"
          disabled={!isReady}
          onClick={upload}
        >
          Upload
        </button>
      </section>

      {(uploaded || publicUrl) && (
        <section className={`${cardClass} flex flex-col gap-4`}>
          <h2 className="m-0 text-chestnut">Latest Upload</h2>
          <Image
            src={publicUrl || buildImageUrl(uploaded?.s3_key || "")}
            alt={uploaded?.alt_text || uploaded?.caption || "Uploaded image"}
            width={uploaded?.width || 600}
            height={uploaded?.height || 400}
            className="block w-full"
            unoptimized
          />
          {uploaded?.caption && <p className="m-0 text-chestnut-dark">{uploaded.caption}</p>}
        </section>
      )}
    </div>
  );
}
