"use client";

import { getFrameStyle, type FrameStyleId } from "@/lib/print/catalog";
import type { PrintSizeInches } from "@/lib/print/quality";

type WallPreviewProps = {
  imageUrl: string;
  alt: string;
  size: PrintSizeInches;
  frameId: FrameStyleId;
  /** Photo aspect width/height; falls back to size aspect */
  photoWidth?: number | null;
  photoHeight?: number | null;
};

/**
 * Relative scale of the framed print on the wall grows with print size
 * (4×6 small → 16×20 large), capped so it stays on the wall scene.
 */
function frameScalePercent(longIn: number): number {
  const min = 22;
  const max = 48;
  const t = (longIn - 4) / (20 - 4);
  return Math.round(min + Math.max(0, Math.min(1, t)) * (max - min));
}

export default function WallPreview({
  imageUrl,
  alt,
  size,
  frameId,
  photoWidth,
  photoHeight
}: WallPreviewProps) {
  const frame = getFrameStyle(frameId);
  const scale = frameScalePercent(size.longIn);
  const pw = photoWidth && photoWidth > 0 ? photoWidth : size.longIn;
  const ph = photoHeight && photoHeight > 0 ? photoHeight : size.shortIn;
  const landscape = pw >= ph;
  const aspect = landscape ? `${size.longIn} / ${size.shortIn}` : `${size.shortIn} / ${size.longIn}`;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#c4b8a4]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/print/wall.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
        style={{
          width: `${scale}%`,
          aspectRatio: aspect,
          border: frame.id === "none" ? "1px solid rgba(0,0,0,0.12)" : frame.border,
          background: frame.mat,
          padding: frame.id === "none" ? 0 : "3%"
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
      <p className="absolute bottom-2 left-2 rounded bg-black/45 px-2 py-0.5 text-xs text-white/90">
        {size.label}
        {frame.id !== "none" ? ` · ${frame.label}` : ""}
      </p>
    </div>
  );
}
