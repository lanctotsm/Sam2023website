"use client";

import { useEffect, useState } from "react";
import { apiFetch, Album } from "@/lib/api";
import { buildImageUrl } from "@/lib/images";
import { toast } from "sonner";

interface AlbumSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (slug: string) => void;
}

export default function AlbumSelectModal({ isOpen, onClose, onSelect }: AlbumSelectModalProps) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchAlbums = async () => {
                setLoading(true);
                try {
                    const data = await apiFetch<Album[]>("/albums");
                    setAlbums(data || []);
                } catch (err) {
                    toast.error("Failed to fetch albums");
                } finally {
                    setLoading(false);
                }
            };
            fetchAlbums();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-desert-tan-dark bg-white shadow-2xl dark:border-dark-muted dark:bg-dark-surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-desert-tan-dark p-4 dark:border-dark-muted">
                    <h3 className="text-xl font-semibold text-chestnut dark:text-dark-text">Select Album</h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-chestnut-dark hover:bg-chestnut/5 dark:text-dark-text dark:hover:bg-dark-bg transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <span className="text-olive dark:text-dark-muted">Loading albums...</span>
                        </div>
                    ) : albums.length === 0 ? (
                        <div className="flex h-32 items-center justify-center">
                            <span className="text-olive dark:text-dark-muted">No albums found.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {albums.map((album) => (
                                <button
                                    key={album.id}
                                    onClick={() => onSelect(album.slug)}
                                    className="group flex flex-col overflow-hidden rounded-xl border border-desert-tan-dark bg-surface text-left transition hover:border-chestnut hover:shadow-lg dark:border-dark-muted dark:bg-dark-bg"
                                >
                                    <div className="aspect-video w-full overflow-hidden bg-desert-tan-dark/10">
                                        {album.cover_image_s3_key ? (
                                            <img
                                                src={buildImageUrl(album.cover_image_s3_key)}
                                                alt={album.title}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-olive/40 italic text-sm">
                                                No cover
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-semibold text-chestnut group-hover:text-chestnut-dark dark:text-dark-text">
                                            {album.title}
                                        </h4>
                                        <p className="mt-1 text-xs text-olive dark:text-dark-muted">
                                            /{album.slug}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
