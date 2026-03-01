"use client";

import { useEffect, useState } from "react";
import { apiFetch, Album, Image } from "@/lib/api";
import AlbumViewer from "@/components/AlbumViewer";

interface ClientAlbumEmbedProps {
    slug: string;
}

export default function ClientAlbumEmbed({ slug }: ClientAlbumEmbedProps) {
    const [album, setAlbum] = useState<Album | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchAlbumData() {
            setLoading(true);
            setError(null);
            try {
                // First get album metadata by slug
                const albumData = await apiFetch<Album>(`/albums/slug/${slug}`);
                if (!mounted) return;
                setAlbum(albumData);

                // Then get images for this album
                const imagesData = await apiFetch<Image[]>(`/albums/${albumData.id}/images`);
                if (!mounted) return;
                setImages(imagesData);
            } catch (err) {
                if (!mounted) return;
                setError(err instanceof Error ? err.message : "Failed to load album");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchAlbumData();

        return () => {
            mounted = false;
        };
    }, [slug]);

    if (loading) {
        return (
            <div className="my-8 rounded-xl border border-desert-tan-dark bg-surface p-8 text-center dark:border-dark-muted dark:bg-dark-surface">
                <div className="mb-2 text-olive dark:text-dark-muted">Loading album: {slug}...</div>
                <div className="h-1 w-32 mx-auto bg-desert-tan-dark/20 overflow-hidden rounded-full">
                    <div className="h-full bg-chestnut dark:bg-caramel animate-progress w-full"></div>
                </div>
            </div>
        );
    }

    if (error || !album) {
        return (
            <div className="my-8 rounded-xl border border-copper bg-copper/5 p-4 text-center text-copper dark:border-copper/50">
                [Album not found: {slug}]
            </div>
        );
    }

    return (
        <div className="my-8">
            <h3 className="text-xl font-semibold text-chestnut dark:text-dark-text mb-4">
                {album.title}
            </h3>
            <AlbumViewer images={images} />
        </div>
    );
}
