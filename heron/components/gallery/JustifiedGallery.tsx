"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildThumbUrl } from "@/lib/images";
import { computeJustifiedLayout } from "@/lib/justifiedLayout";
import type { Image as AlbumImage } from "@/lib/api";

export type Density = "comfortable" | "compact";

interface JustifiedGalleryProps {
  images: AlbumImage[];
  onOpen: (index: number) => void;
  /** Index to mark for the View Transition morph into the lightbox. */
  activeIndex?: number | null;
}

const GAP = 4;

/**
 * Row height tracks the viewport so phones get a few big photos per screen
 * instead of a wall of thumbnails.
 */
function targetRowHeightFor(containerWidth: number, density: Density): number {
  const base =
    containerWidth < 480 ? 150 : containerWidth < 768 ? 190 : containerWidth < 1024 ? 230 : 280;
  return density === "compact" ? Math.round(base * 0.7) : base;
}

export default function JustifiedGallery({
  images,
  onOpen,
  activeIndex = null
}: JustifiedGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [density, setDensity] = useState<Density>("comfortable");
  // Keyed by image id, not position, so reordering an album cannot mark a
  // different photo as already painted.
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (el) setContainerWidth(el.clientWidth);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const targetRowHeight = containerWidth
    ? targetRowHeightFor(containerWidth, density)
    : 0;

  const layout = useMemo(
    () =>
      computeJustifiedLayout(
        images.map((image) => ({ width: image.width, height: image.height })),
        { containerWidth, targetRowHeight, gap: GAP }
      ),
    [images, containerWidth, targetRowHeight]
  );

  const markLoaded = useCallback((imageId: number) => {
    setLoaded((previous) => {
      if (previous.has(imageId)) return previous;
      const next = new Set(previous);
      next.add(imageId);
      return next;
    });
  }, []);

  const showDensityToggle = containerWidth >= 768 && images.length > 3;

  return (
    <div className="grid gap-3">
      {showDensityToggle && (
        <div className="flex justify-end">
          <div
            className="inline-flex overflow-hidden rounded-lg border border-hairline dark:border-dark-hairline"
            role="group"
            aria-label="Photo size"
          >
            {(["comfortable", "compact"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDensity(value)}
                aria-pressed={density === value}
                className={`min-h-[44px] px-3 text-xs font-medium capitalize transition fine-pointer:min-h-0 fine-pointer:py-1.5 ${
                  density === value
                    ? "bg-chestnut text-desert-tan dark:bg-caramel dark:text-chestnut-dark"
                    : "bg-surface text-chestnut-dark hover:bg-surface-hover dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-surface-hover"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: layout.containerHeight || undefined }}
      >
        {/*
          Before the first measurement there is no width to lay out against, so
          render nothing rather than a flash of unpositioned images.
        */}
        {containerWidth > 0 &&
          layout.boxes.map((box) => {
            const image = images[box.index];
            const isLoaded = loaded.has(image.id);
            const label =
              image.alt_text ||
              image.caption ||
              `View photo ${box.index + 1} of ${images.length}`;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => onOpen(box.index)}
                aria-label={label}
                className="group absolute overflow-hidden rounded-md bg-desert-tan-dark focus-visible:z-10 dark:bg-dark-surface"
                style={{
                  top: box.top,
                  left: box.left,
                  width: box.width,
                  height: box.height,
                  // The blurred placeholder shows through until the thumb paints
                  backgroundImage: image.lqip ? `url(${image.lqip})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  viewTransitionName:
                    activeIndex === box.index ? "gallery-active-photo" : undefined
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildThumbUrl(image)}
                  alt={image.alt_text || image.caption || ""}
                  width={box.width}
                  height={box.height}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => markLoaded(image.id)}
                  onError={() => markLoaded(image.id)}
                  className={`h-full w-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
                {image.caption && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
                    {image.caption}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
