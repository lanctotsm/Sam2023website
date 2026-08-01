"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildLargeUrl, buildOriginalUrl, buildThumbUrl } from "@/lib/images";
import type { Image as AlbumImage } from "@/lib/api";

interface LightboxProps {
  images: AlbumImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SLIDESHOW_MS = 4000;
const SWIPE_THRESHOLD = 50;

type Transform = { index: number; scale: number; x: number; y: number };

const IDENTITY = { scale: 1, x: 0, y: 0 };

function iconProps(size = 22) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };
}

export default function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const filmstripRef = useRef<HTMLDivElement | null>(null);

  // Keyed by index so navigating always starts from an unzoomed view without
  // needing an effect to reset it.
  const [stored, setStored] = useState<Transform>({ index, ...IDENTITY });
  const transform = stored.index === index ? stored : { index, ...IDENTITY };
  const { scale, x, y } = transform;

  const [playing, setPlaying] = useState(false);
  // Tracked per index so the placeholder returns for each newly opened photo.
  const [loadedIndex, setLoadedIndex] = useState<number | null>(null);
  const loaded = loadedIndex === index;
  const [copied, setCopied] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [gesturing, setGesturing] = useState(false);

  const image = images[index];
  const count = images.length;

  const setTransform = useCallback(
    (next: Partial<Omit<Transform, "index">>) => {
      setStored((previous) => {
        const base = previous.index === index ? previous : { index, ...IDENTITY };
        return { ...base, ...next, index };
      });
    },
    [index]
  );

  const resetTransform = useCallback(() => setTransform(IDENTITY), [setTransform]);

  /**
   * Zoom via a functional update so repeated presses accumulate correctly even
   * when several land in the same render.
   */
  const applyScale = useCallback(
    (compute: (previousScale: number) => number) => {
      setStored((previous) => {
        const base = previous.index === index ? previous : { index, ...IDENTITY };
        const next = Math.min(MAX_SCALE, Math.max(1, compute(base.scale)));
        // Returning to 1x must recentre, otherwise the image stays panned off.
        if (next === 1) return { index, ...IDENTITY };
        return { ...base, scale: next, index };
      });
    },
    [index]
  );

  const zoomBy = useCallback(
    (delta: number) => applyScale((current) => current + delta),
    [applyScale]
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      if (count === 0) return;
      onIndexChange(((nextIndex % count) + count) % count);
    },
    [count, onIndexChange]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  const zoomTo = useCallback(
    (nextScale: number) => applyScale(() => nextScale),
    [applyScale]
  );

  // Lock the page behind the overlay.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Warm the neighbours so arrow navigation feels instant.
  useEffect(() => {
    if (count <= 1) return;
    const neighbours = [(index + 1) % count, (index - 1 + count) % count];
    const preloaded = neighbours.map((i) => {
      const img = new window.Image();
      img.src = buildLargeUrl(images[i]);
      return img;
    });
    return () => {
      // about:blank avoids the empty-src quirk that resolves to the document URL
      // and triggers a spurious fetch of the current page.
      preloaded.forEach((img) => {
        img.src = "about:blank";
      });
    };
  }, [images, index, count]);

  // Slideshow ticker; advancing through the shared handler keeps the URL in sync.
  useEffect(() => {
    if (!playing || count <= 1) return;
    const timer = window.setInterval(() => {
      onIndexChange((index + 1) % count);
    }, SLIDESHOW_MS);
    return () => window.clearInterval(timer);
  }, [playing, index, count, onIndexChange]);

  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  // Keep the active filmstrip thumb visible as the index moves.
  useEffect(() => {
    const strip = filmstripRef.current;
    const active = strip?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [index]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the URL is already in the address bar.
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          if (scale > 1) resetTransform();
          else onClose();
          break;
        case "ArrowRight":
          event.preventDefault();
          next();
          break;
        case "ArrowLeft":
          event.preventDefault();
          previous();
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(count - 1);
          break;
        case "+":
        case "=":
          event.preventDefault();
          zoomBy(0.5);
          break;
        case "-":
        case "_":
          event.preventDefault();
          zoomBy(-0.5);
          break;
        case "0":
          event.preventDefault();
          resetTransform();
          break;
        case " ": {
          // Space must still activate whatever control has focus.
          const target = event.target as HTMLElement | null;
          if (target?.closest("button, a[href], input, select, textarea")) break;
          event.preventDefault();
          setPlaying((p) => !p);
          break;
        }
        case "Tab": {
          // Focus trap: keep tabbing inside the dialog.
          const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) break;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scale, next, previous, goTo, count, zoomBy, resetTransform, onClose]);

  // Pointer gestures: pan when zoomed, pinch with two fingers, swipe when at 1x.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startDistance: number;
    startScale: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    swiping: boolean;
  } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setGesturing(true);
    const points = [...pointers.current.values()];

    if (points.length === 2) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      gesture.current = {
        startDistance: distance,
        startScale: scale,
        startX: event.clientX,
        startY: event.clientY,
        originX: x,
        originY: y,
        swiping: false
      };
    } else if (points.length === 1) {
      gesture.current = {
        startDistance: 0,
        startScale: scale,
        startX: event.clientX,
        startY: event.clientY,
        originX: x,
        originY: y,
        swiping: scale === 1
      };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const active = gesture.current;
    if (!active) return;

    const points = [...pointers.current.values()];

    if (points.length === 2 && active.startDistance > 0) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(1, active.startScale * (distance / active.startDistance))
      );
      setTransform({ scale: nextScale });
      return;
    }

    if (points.length === 1 && scale > 1) {
      setTransform({
        x: active.originX + (event.clientX - active.startX),
        y: active.originY + (event.clientY - active.startY)
      });
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const active = gesture.current;
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(event.pointerId);

    if (active && wasSingle && active.swiping && scale === 1) {
      const deltaX = event.clientX - active.startX;
      const deltaY = event.clientY - active.startY;
      // Ignore mostly-vertical drags so a scroll gesture never flips the photo.
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        setPlaying(false);
        if (deltaX < 0) next();
        else previous();
      }
    }

    if (pointers.current.size === 0) {
      gesture.current = null;
      setGesturing(false);
    }
  };

  const onDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    zoomTo(scale > 1 ? 1 : DOUBLE_TAP_SCALE);
  };

  /*
   * React registers onWheel as a passive listener, so preventDefault() there is
   * ignored and logs an error. Binding natively is the only way to stop the
   * browser from zooming the page out from under the overlay.
   */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      zoomBy(-event.deltaY * 0.004);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const caption = image?.caption || image?.alt_text || "";
  const largeUrl = useMemo(() => (image ? buildLargeUrl(image) : ""), [image]);

  if (!image) return null;

  const controlClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${count}${caption ? `: ${caption}` : ""}`}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex touch-none flex-col bg-black/95 outline-none backdrop-blur-md"
      style={{ height: "100dvh" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header
        className={`flex shrink-0 items-center justify-between gap-2 px-3 transition-opacity ${
          showChrome ? "opacity-100" : "opacity-0"
        }`}
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))"
        }}
      >
        <p className="text-sm font-medium text-white/80" aria-live="polite">
          {index + 1} / {count}
        </p>
        <div className="flex items-center gap-1.5">
          {count > 1 && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className={controlClass}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              aria-pressed={playing}
            >
              {playing ? (
                <svg {...iconProps()}>
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg {...iconProps()}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => zoomTo(scale > 1 ? 1 : DOUBLE_TAP_SCALE)}
            className={controlClass}
            aria-label={scale > 1 ? "Reset zoom" : "Zoom in"}
          >
            <svg {...iconProps()}>
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
              {scale > 1 ? (
                <line x1="8" y1="11" x2="14" y2="11" />
              ) : (
                <>
                  <line x1="8" y1="11" x2="14" y2="11" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                </>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={copyLink}
            className={controlClass}
            aria-label={copied ? "Link copied" : "Copy link to this photo"}
          >
            {copied ? (
              <svg {...iconProps()}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg {...iconProps()}>
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
              </svg>
            )}
          </button>
          <a
            href={buildOriginalUrl(image)}
            download
            target="_blank"
            rel="noopener noreferrer"
            className={controlClass}
            aria-label="Download original photo"
          >
            <svg {...iconProps()}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
          <button type="button" onClick={onClose} className={controlClass} aria-label="Close">
            <svg {...iconProps()}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onClick={(event) => {
          if (event.target === event.currentTarget && scale === 1) setShowChrome((s) => !s);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.id}
          src={largeUrl}
          alt={image.alt_text || image.caption || `Photo ${index + 1}`}
          onLoad={() => setLoadedIndex(index)}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
            transition: gesturing ? "none" : "transform 200ms ease-out",
            cursor: scale > 1 ? "grab" : "zoom-in",
            // The placeholder fills the frame while the large file streams in
            backgroundImage: !loaded && image.lqip ? `url(${image.lqip})` : undefined,
            backgroundSize: "cover",
            viewTransitionName: "gallery-active-photo"
          }}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                previous();
              }}
              className={`absolute left-2 top-1/2 -translate-y-1/2 ${controlClass} ${
                showChrome ? "opacity-100" : "opacity-0"
              }`}
              style={{ marginLeft: "env(safe-area-inset-left)" }}
              aria-label="Previous photo"
            >
              <svg {...iconProps(26)}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                next();
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${controlClass} ${
                showChrome ? "opacity-100" : "opacity-0"
              }`}
              style={{ marginRight: "env(safe-area-inset-right)" }}
              aria-label="Next photo"
            >
              <svg {...iconProps(26)}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <footer
        className={`shrink-0 transition-opacity ${showChrome ? "opacity-100" : "opacity-0"}`}
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
          paddingRight: "max(0.5rem, env(safe-area-inset-right))"
        }}
      >
        {caption && (
          <p className="mx-auto max-w-2xl px-3 pb-2 text-center text-sm text-white/85">
            {caption}
          </p>
        )}
        {count > 1 && (
          <div
            ref={filmstripRef}
            className="hidden gap-1.5 overflow-x-auto px-2 pb-1 sm:flex"
            role="tablist"
            aria-label="Photos in this album"
          >
            {images.map((thumb, thumbIndex) => (
              <button
                key={thumb.id}
                type="button"
                role="tab"
                aria-selected={thumbIndex === index}
                data-active={thumbIndex === index}
                onClick={() => {
                  setPlaying(false);
                  goTo(thumbIndex);
                }}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded transition ${
                  thumbIndex === index
                    ? "ring-2 ring-caramel"
                    : "opacity-55 hover:opacity-100"
                }`}
                aria-label={`Photo ${thumbIndex + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildThumbUrl(thumb)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{
                    backgroundImage: thumb.lqip ? `url(${thumb.lqip})` : undefined,
                    backgroundSize: "cover"
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
