"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JustifiedGallery from "@/components/gallery/JustifiedGallery";
import Lightbox from "@/components/gallery/Lightbox";
import PrintConfigurator from "@/components/print/PrintConfigurator";
import { isPrintOrderingEnabled } from "@/lib/print/catalog";
import type { Image as AlbumImage } from "@/lib/api";

interface AlbumViewerProps {
    images: AlbumImage[];
}

const PHOTO_PARAM = "photo";

function photoUrl(imageId: number | null) {
    const url = new URL(window.location.href);
    if (imageId === null) url.searchParams.delete(PHOTO_PARAM);
    else url.searchParams.set(PHOTO_PARAM, String(imageId));
    return url;
}

/**
 * Preserving the existing history state keeps the App Router's own bookkeeping
 * intact, so popping our entry does not trigger a route change.
 */
function replacePhotoParam(imageId: number | null) {
    window.history.replaceState(window.history.state, "", photoUrl(imageId));
}

function withViewTransition(update: () => void) {
    const startViewTransition = (
        document as Document & { startViewTransition?: (cb: () => void) => void }
    ).startViewTransition;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof startViewTransition === "function" && !prefersReducedMotion) {
        startViewTransition.call(document, update);
        return;
    }
    update();
}

export default function AlbumViewer({ images }: AlbumViewerProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    // The thumbnail that acts as the morph source. Only one element may carry
    // the view-transition-name per snapshot, so the gallery holds it while
    // closed and the lightbox takes over once open.
    const [morphIndex, setMorphIndex] = useState<number | null>(null);
    const [printImage, setPrintImage] = useState<AlbumImage | null>(null);
    const printOrdering = isPrintOrderingEnabled();

    // Restore a shared ?photo=<id> link on first paint.
    useEffect(() => {
        const id = Number(new URLSearchParams(window.location.search).get(PHOTO_PARAM));
        if (!Number.isFinite(id) || id <= 0) return;
        const index = images.findIndex((image) => image.id === id);
        if (index >= 0) setOpenIndex(index);
        // Intentionally only on mount: later changes are driven by user actions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // True while we own a pushed history entry that Back should consume.
    const pushedEntry = useRef(false);

    const open = useCallback(
        (index: number) => {
            // Name the source thumbnail first, then start the transition on the
            // next frame so the old snapshot has something to morph from.
            setMorphIndex(index);
            requestAnimationFrame(() => {
                withViewTransition(() => setOpenIndex(index));
                const id = images[index]?.id ?? null;
                // One entry per open, so Back closes the photo instead of
                // leaving the album. Arrow presses replace it rather than stack.
                if (pushedEntry.current) {
                    replacePhotoParam(id);
                } else {
                    window.history.pushState(window.history.state, "", photoUrl(id));
                    pushedEntry.current = true;
                }
            });
        },
        [images]
    );

    const close = useCallback(() => {
        if (pushedEntry.current) {
            // Let popstate drive the close so the history stack stays consistent
            // whether the user clicks Close or presses Back.
            window.history.back();
            return;
        }
        // Arrived via a shared ?photo= link, so there is no entry of ours to pop.
        withViewTransition(() => setOpenIndex(null));
        replacePhotoParam(null);
    }, []);

    const changeIndex = useCallback(
        (index: number) => {
            setOpenIndex(index);
            setMorphIndex(index);
            replacePhotoParam(images[index]?.id ?? null);
        },
        [images]
    );

    useEffect(() => {
        const onPopState = () => {
            const id = Number(new URLSearchParams(window.location.search).get(PHOTO_PARAM));
            const index = images.findIndex((image) => image.id === id);
            pushedEntry.current = false;
            withViewTransition(() => setOpenIndex(index >= 0 ? index : null));
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [images]);

    if (images.length === 0) {
        return (
            <p className="surface-card text-center text-olive dark:text-dark-muted">
                This album is empty.
            </p>
        );
    }

    return (
        <article className="grid gap-4">
            <JustifiedGallery
                images={images}
                onOpen={open}
                activeIndex={openIndex === null ? morphIndex : null}
            />
            {openIndex !== null && (
                <Lightbox
                    images={images}
                    index={openIndex}
                    onIndexChange={changeIndex}
                    onClose={close}
                    onOrderPrint={printOrdering ? (image) => setPrintImage(image) : undefined}
                />
            )}
            {printImage && (
                <PrintConfigurator
                    key={printImage.id}
                    image={printImage}
                    onClose={() => setPrintImage(null)}
                />
            )}
        </article>
    );
}
