"use client";

import { useState } from "react";
import Image from "next/image";
import type { Image as ImageMeta } from "@/lib/api";
import { createImage, presignImage } from "@/lib/api";

export default function AdminMediaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<ImageMeta | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState("");

  const upload = async () => {
    if (!file) {
      return;
    }

    setStatus("Presigning upload...");
    const presign = await presignImage(file.name, file.type, file.size);

    setStatus("Uploading to S3...");
    await fetch(presign.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type
      },
      body: file
    });

    setStatus("Saving metadata...");
    const metadata = await createImage({
      s3_key: presign.s3_key,
      caption,
      alt_text: altText
    });

    setUploaded(metadata);
    setStatus("Upload complete");
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Upload Image</h2>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <label>Caption</label>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} />
        <label>Alt Text</label>
        <input value={altText} onChange={(e) => setAltText(e.target.value)} />
        <button onClick={upload}>Upload</button>
        {status && <p>{status}</p>}
      </section>

      {uploaded && (
        <section className="card stack">
          <h3>Latest Upload</h3>
          <Image
            src={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${uploaded.s3_key}`}
            alt={uploaded.alt_text || uploaded.caption || "Uploaded image"}
            width={uploaded.width || 600}
            height={uploaded.height || 400}
            style={{ width: "100%", height: "auto" }}
          />
          <p>{uploaded.caption}</p>
        </section>
      )}
    </div>
  );
}
