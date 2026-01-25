"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
      .then(setAlbums)
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
      router.push(`/albums/${albums.find((album) => album.id === Number(albumId))?.slug}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h1>Upload Photo</h1>
        <label>Album</label>
        <select value={albumId} onChange={(event) => setAlbumId(event.target.value)}>
          <option value="">Select an album</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
        <label>Photo</label>
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <label>Caption</label>
        <input value={caption} onChange={(event) => setCaption(event.target.value)} />
        <label>Alt Text</label>
        <input value={altText} onChange={(event) => setAltText(event.target.value)} />
        {status === "uploading" && <progress value={progress} max={100} />}
        {status !== "idle" && status !== "uploading" && <p className="muted">{status}</p>}
        {error && <p className="error">{error}</p>}
        <button disabled={!isReady} onClick={upload}>
          Upload
        </button>
      </section>

      {(uploaded || publicUrl) && (
        <section className="card stack">
          <h2>Latest Upload</h2>
          <Image
            src={publicUrl || buildImageUrl(uploaded?.s3_key || "")}
            alt={uploaded?.alt_text || uploaded?.caption || "Uploaded image"}
            width={uploaded?.width || 600}
            height={uploaded?.height || 400}
            style={{ width: "100%", height: "auto" }}
          />
          {uploaded?.caption && <p>{uploaded.caption}</p>}
        </section>
      )}
    </div>
  );
}
