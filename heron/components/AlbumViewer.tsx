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
            <p className="album-viewer__empty">This album is empty.</p>
        );
    }

    const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

    return (
        <article className="album-viewer">
            <nav className="album-viewer__controls" aria-label="Gallery view options">
                <button
                    onClick={() => setViewMode("grid")}
                    className={`album-viewer__button ${viewMode === "grid" ? "album-viewer__button--active" : ""}`}
                >
                    Grid
                </button>
                <button
                    onClick={() => setViewMode("masonry")}
                    className={`album-viewer__button ${viewMode === "masonry" ? "album-viewer__button--active" : ""}`}
                >
                    Masonry
                </button>
            </nav>

            <div className="album-viewer__content">
                {viewMode === "grid" ? (
                    <div className="album-viewer__grid">
                        {images.map((image, idx) => (
                            <figure
                                key={image.id}
                                className="album-viewer__item"
                                onClick={() => openLightbox(idx)}
                            >
                                <Image
                                    src={buildThumbUrl(image)}
                                    alt={image.alt_text || image.caption || "Album image"}
                                    fill
                                    className="album-viewer__image"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    unoptimized
                                />
                                {image.caption && <figcaption className="sr-only">{image.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                ) : (
                    <div className="album-viewer__masonry">
                        {images.map((image, idx) => (
                            <figure
                                key={image.id}
                                className="album-viewer__item"
                                onClick={() => openLightbox(idx)}
                            >
                                <Image
                                    src={buildThumbUrl(image)}
                                    alt={image.alt_text || image.caption || "Album image"}
                                    width={image.width || 600}
                                    height={image.height || 400}
                                    className="album-viewer__image"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    unoptimized
                                />
                                {image.caption && <figcaption className="sr-only">{image.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                )}
            </div>

            {currentImage && (
                <div role="dialog" aria-modal="true" className="lightbox">
                    <button
                        onClick={closeLightbox}
                        className="lightbox__close"
                        aria-label="Close lightbox"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="lightbox__nav lightbox__nav--prev"
                        aria-label="Previous image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="lightbox__nav lightbox__nav--next"
                        aria-label="Next image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    <div
                        className="lightbox__content"
                        onClick={closeLightbox}
                    >
                        <div
                            className="lightbox__wrapper"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={buildLargeUrl(currentImage)}
                                alt={currentImage.caption || "Fullscreen image"}
                                className="lightbox__image"
                            />
                            {currentImage.caption && (
                                <div className="lightbox__caption">
                                    <span className="lightbox__caption-text">
                                        {currentImage.caption}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}
