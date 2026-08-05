"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type { Image as ImageType } from "@/lib/api";

export type ImageEditMetadata = {
  name: string;
  caption: string;
  alt_text: string;
  description: string;
  tags: string;
};

type Props = {
  image: ImageType;
  imageUrl: string;
  onSaveMetadata: (payload: ImageEditMetadata) => Promise<void>;
  onRotate: () => Promise<void>;
  onCrop: (blob: Blob) => Promise<void>;
  onGenerateAlt?: () => Promise<string>;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2 text-sm text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted";
const labelClass = "text-sm font-medium text-chestnut-dark dark:text-dark-text";

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageEditModal({
  image,
  imageUrl,
  onSaveMetadata,
  onRotate,
  onCrop,
  onGenerateAlt,
  onClose
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [previewUrl, setPreviewUrl] = useState(imageUrl);
  const [form, setForm] = useState<ImageEditMetadata>({
    name: image.name ?? "",
    caption: image.caption ?? "",
    alt_text: image.alt_text ?? "",
    description: image.description ?? "",
    tags: image.tags ?? ""
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [applyingCrop, setApplyingCrop] = useState(false);
  const [generatingAlt, setGeneratingAlt] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreviewUrl(`${imageUrl}${imageUrl.includes("?") ? "&" : "?"}t=${Date.now()}`);
    setCropMode(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [imageUrl, image.id, image.width, image.height, image.s3_key]);

  useEffect(() => {
    setForm({
      name: image.name ?? "",
      caption: image.caption ?? "",
      alt_text: image.alt_text ?? "",
      description: image.description ?? "",
      tags: image.tags ?? ""
    });
  }, [image]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleSaveMetadata = async () => {
    setSavingMeta(true);
    setBusy(true);
    try {
      await onSaveMetadata({
        name: form.name.trim(),
        caption: form.caption.trim(),
        alt_text: form.alt_text.trim(),
        description: form.description.trim(),
        tags: form.tags.trim()
      });
    } finally {
      setSavingMeta(false);
      setBusy(false);
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    setBusy(true);
    try {
      await onRotate();
    } finally {
      setRotating(false);
      setBusy(false);
    }
  };

  const handleApplyCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    setApplyingCrop(true);
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      if (blob) {
        await onCrop(blob);
        setCropMode(false);
        setCrop(undefined);
        setCompletedCrop(undefined);
      }
    } finally {
      setApplyingCrop(false);
      setBusy(false);
    }
  };

  const handleGenerateAlt = async () => {
    if (!onGenerateAlt) return;
    setGeneratingAlt(true);
    setBusy(true);
    try {
      const alt = await onGenerateAlt();
      setForm((f) => ({ ...f, alt_text: alt }));
    } finally {
      setGeneratingAlt(false);
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-edit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-desert-tan-dark bg-surface shadow-xl dark:border-dark-muted dark:bg-dark-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-desert-tan-dark/60 px-4 py-3 dark:border-dark-muted">
          <h3 id="image-edit-title" className="m-0 text-lg font-semibold text-chestnut dark:text-dark-text">
            Edit photo
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleRotate}
              className="rounded-lg border border-desert-tan-dark px-3 py-1.5 text-sm font-medium text-chestnut transition hover:bg-surface-hover disabled:opacity-60 dark:border-dark-muted dark:text-dark-text dark:hover:bg-dark-bg"
            >
              {rotating ? "Rotating…" : "Rotate 90°"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setCropMode((v) => !v);
                setCompletedCrop(undefined);
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                cropMode
                  ? "border-chestnut bg-chestnut text-desert-tan dark:text-dark-text"
                  : "border-desert-tan-dark text-chestnut hover:bg-surface-hover dark:border-dark-muted dark:text-dark-text dark:hover:bg-dark-bg"
              }`}
            >
              {cropMode ? "Cancel crop" : "Crop"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-lg border border-chestnut bg-transparent px-3 py-1.5 text-sm text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text"
            >
              Close
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-auto lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
          <div className="flex flex-col gap-3 bg-desert-tan-dark/10 p-4 dark:bg-dark-bg/40">
            <div className="flex max-h-[55vh] items-center justify-center overflow-auto rounded-lg bg-black/5 dark:bg-black/20">
              {cropMode ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                  aspect={undefined}
                  className="max-h-[55vh]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Crop needs raw img for canvas */}
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt={form.alt_text || form.caption || "Edit"}
                    onLoad={onImageLoad}
                    className="max-h-[55vh] w-auto"
                  />
                </ReactCrop>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- Preview needs cache-busting src
                <img
                  src={previewUrl}
                  alt={form.alt_text || form.caption || "Preview"}
                  className="max-h-[55vh] w-auto object-contain"
                />
              )}
            </div>
            {cropMode && (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!completedCrop || applyingCrop || busy}
                  onClick={handleApplyCrop}
                  className="rounded-lg bg-chestnut px-4 py-2 text-sm font-semibold text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
                >
                  {applyingCrop ? "Applying crop…" : "Apply crop"}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-desert-tan-dark/60 p-4 dark:border-dark-muted lg:border-l lg:border-t-0">
            <p className="m-0 text-xs text-olive dark:text-dark-muted">
              Alt text is for accessibility only — it is not shown on the album grid.
            </p>
            <div>
              <label className={labelClass} htmlFor="edit-name">
                Name
              </label>
              <input
                id="edit-name"
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Short name"
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-caption">
                Caption
              </label>
              <input
                id="edit-caption"
                className={inputClass}
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                placeholder="Caption shown with the photo"
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-alt">
                Alt text
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="edit-alt"
                  className={inputClass}
                  value={form.alt_text}
                  onChange={(e) => setForm((f) => ({ ...f, alt_text: e.target.value }))}
                  placeholder="Describe the image for screen readers"
                  disabled={busy}
                />
                {onGenerateAlt && (
                  <button
                    type="button"
                    disabled={busy || generatingAlt}
                    onClick={handleGenerateAlt}
                    className="shrink-0 rounded-lg border border-chestnut bg-transparent px-3 py-2 text-sm font-medium text-chestnut transition hover:bg-chestnut/5 disabled:opacity-60 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
                  >
                    {generatingAlt ? "Generating…" : "Generate alt text"}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-description">
                Description
              </label>
              <textarea
                id="edit-description"
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Longer description"
                rows={3}
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-tags">
                Tags
              </label>
              <input
                id="edit-tags"
                className={inputClass}
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="Comma-separated tags"
                disabled={busy}
              />
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={savingMeta || busy}
                onClick={handleSaveMetadata}
                className="rounded-lg bg-chestnut px-4 py-2.5 text-sm font-semibold text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
              >
                {savingMeta ? "Saving…" : "Save info"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-lg border border-chestnut bg-transparent px-4 py-2.5 text-sm text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: Crop): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (crop.x == null || crop.y == null || crop.width == null || crop.height == null) {
    return null;
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const cropX = (crop.x / 100) * image.width * scaleX;
  const cropY = (crop.y / 100) * image.height * scaleY;
  const cropW = (crop.width / 100) * image.width * scaleX;
  const cropH = (crop.height / 100) * image.height * scaleY;

  canvas.width = cropW;
  canvas.height = cropH;
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
}
