"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { buildLargeUrl, buildThumbUrl } from "@/lib/images";
import type { Image as AlbumImage } from "@/lib/api";

type ViewMode = "grid" | "masonry";

interface AlbumViewerProps {
    images: AlbumImage[];
}

export default function AlbumViewer({ images }: AlbumViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("masonry");
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const nextImage = useCallback(() => {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
    }, [images.length]);

    const prevImage = useCallback(() => {
        setLightboxIndex((prev) =>
            prev === null ? null : (prev - 1 + images.length) % images.length
        );
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") nextImage();
            if (e.key === "ArrowLeft") prevImage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, nextImage, prevImage]);

    if (images.length === 0) {
        return (
            <p className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center text-olive dark:border-dark-muted dark:bg-dark-surface dark:text-dark-muted">
                This album is empty.
            </p>
        );
    }

    const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

    const buttonBase = "rounded-lg border border-desert-tan-dark px-4 py-2 text-sm font-medium transition dark:border-dark-muted";
    const buttonActive = "bg-chestnut text-desert-tan dark:bg-caramel dark:text-chestnut-dark";
    const buttonInactive = "bg-surface text-chestnut-dark hover:bg-surface-hover dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-bg";

    return (
        <article className="grid gap-4">
            <nav className="flex flex-wrap gap-2" aria-label="Gallery view options">
                <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`${buttonBase} ${viewMode === "grid" ? buttonActive : buttonInactive}`}
                >
                    Grid
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode("masonry")}
                    className={`${buttonBase} ${viewMode === "masonry" ? buttonActive : buttonInactive}`}
                >
                    Masonry
                </button>
            </nav>

            <div>
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                        {images.map((image, idx) => (
                            <figure
                                key={image.id}
                                className="m-0"
                            >
                                <button
                                    type="button"
                                    onClick={() => openLightbox(idx)}
                                    className="w-full cursor-pointer overflow-hidden rounded-xl border border-desert-tan-dark bg-surface p-3 text-left shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel hover:shadow-[0_8px_24px_rgba(72,9,3,0.15)] dark:border-dark-muted dark:bg-dark-surface dark:hover:border-caramel/50"
                                    aria-label={image.alt_text || image.caption || `View image ${idx + 1} of ${images.length}`}
                                >
                                    <span className="relative block h-[220px] w-full overflow-hidden rounded-lg">
                                        <Image
                                            src={buildThumbUrl(image)}
                                            alt={image.alt_text || image.caption || "Album image"}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            unoptimized
                                        />
                                    </span>
                                </button>
                                {image.caption && <figcaption className="sr-only">{image.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                        {images.map((image, idx) => (
                            <figure
                                key={image.id}
                                className="m-0"
                            >
                                <button
                                    type="button"
                                    onClick={() => openLightbox(idx)}
                                    className="w-full cursor-pointer overflow-hidden rounded-xl border border-desert-tan-dark bg-surface p-3 text-left shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel hover:shadow-[0_8px_24px_rgba(72,9,3,0.15)] dark:border-dark-muted dark:bg-dark-surface dark:hover:border-caramel/50"
                                    aria-label={image.alt_text || image.caption || `View image ${idx + 1} of ${images.length}`}
                                >
                                    <Image
                                        src={buildThumbUrl(image)}
                                        alt={image.alt_text || image.caption || "Album image"}
                                        width={image.width || 600}
                                        height={image.height || 400}
                                        className="block w-full rounded-lg object-cover"
                                        style={{ height: "220px" }}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        unoptimized
                                    />
                                </button>
                                {image.caption && <figcaption className="sr-only">{image.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                )}
            </div>

            {currentImage && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={closeLightbox}
                >
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                        aria-label="Close lightbox"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                        aria-label="Previous image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                        aria-label="Next image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={buildLargeUrl(currentImage)}
                            alt={currentImage.caption || "Fullscreen image"}
                            className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
                        />
                        {currentImage.caption && (
                            <p className="mt-2 text-center text-sm text-white/90">
                                {currentImage.caption}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}
