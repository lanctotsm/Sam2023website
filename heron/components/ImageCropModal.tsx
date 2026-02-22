"use client";

import { useCallback, useRef, useState } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

type Props = {
  imageUrl: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
};

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropModal({ imageUrl, onCrop, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [loading, setLoading] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleApply = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    setLoading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      if (blob) {
        onCrop(blob);
      }
    } finally {
      setLoading(false);
    }
  }, [completedCrop, onCrop]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-xl dark:border-dark-muted dark:bg-dark-surface">
        <h3 className="mb-4 text-chestnut dark:text-dark-text">Crop image</h3>
        <div className="mb-4 overflow-hidden rounded-lg bg-desert-tan-dark/20 dark:bg-dark-muted/20">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
            aspect={undefined}
            className="max-h-[60vh]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Crop component requires raw img for canvas operations */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop"
              onLoad={onImageLoad}
              className="max-h-[60vh] w-auto"
            />
          </ReactCrop>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-chestnut bg-transparent px-4 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!completedCrop || loading}
            className="rounded-lg bg-chestnut px-4 py-2 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
          >
            {loading ? "Applying..." : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: Crop): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (
    crop.x == null ||
    crop.y == null ||
    crop.width == null ||
    crop.height == null
  ) {
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
