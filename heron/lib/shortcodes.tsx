import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseShortcodes } from "./shortcodes-parser";
import { getDb } from "@/lib/db";
import { albums, albumImages, images } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import AlbumViewer from "@/components/AlbumViewer";


// ---------------------------------------------------------------------------
// Server-side album embed (hits the DB directly, used on the public post page)
// ---------------------------------------------------------------------------

type AlbumData = {
    title: string;
    formattedImages: {
        id: number;
        s3_key: string;
        s3_key_thumb: string | null;
        s3_key_large: string | null;
        s3_key_original: string | null;
        width: number | null;
        height: number | null;
        name: string;
        caption: string;
        alt_text: string;
        description: string;
        tags: string;
        created_by: number | null;
        created_at: string;
    }[];
};

async function fetchAlbumData(slug: string): Promise<{ status: "ok"; data: AlbumData } | { status: "not_found" } | { status: "error" }> {
    try {
        const db = getDb();

        const albumRows = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
        const album = albumRows[0];

        if (!album) {
            return { status: "not_found" };
        }

        const rows = await db
            .select({
                id: images.id,
                s3Key: images.s3Key,
                s3KeyThumb: images.s3KeyThumb,
                s3KeyLarge: images.s3KeyLarge,
                s3KeyOriginal: images.s3KeyOriginal,
                width: images.width,
                height: images.height,
                name: images.name,
                caption: images.caption,
                altText: images.altText,
                description: images.description,
                tags: images.tags,
                createdBy: images.createdBy,
                createdAt: images.createdAt,
                sortOrder: albumImages.sortOrder
            })
            .from(albumImages)
            .innerJoin(images, eq(albumImages.imageId, images.id))
            .where(eq(albumImages.albumId, album.id))
            .orderBy(asc(albumImages.sortOrder), asc(images.id));

        const formattedImages = rows.map((row) => ({
            id: row.id,
            s3_key: row.s3Key,
            s3_key_thumb: row.s3KeyThumb,
            s3_key_large: row.s3KeyLarge,
            s3_key_original: row.s3KeyOriginal,
            width: row.width,
            height: row.height,
            name: row.name || "",
            caption: row.caption || "",
            alt_text: row.altText || "",
            description: row.description || "",
            tags: row.tags || "",
            created_by: row.createdBy || null,
            created_at: row.createdAt
        }));

        return { status: "ok", data: { title: album.title, formattedImages } };
    } catch (error) {
        console.error(`Failed to load album "${slug}":`, error);
        return { status: "error" };
    }
}

async function AlbumEmbed({ slug }: { slug: string }) {
    const result = await fetchAlbumData(slug);

    if (result.status === "not_found") {
        return (
            <div className="rounded-xl border border-copper bg-copper/5 p-4 text-center text-copper dark:border-copper/50">
                [Album not found: {slug}]
            </div>
        );
    }

    if (result.status === "error") {
        return (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center text-red-700 dark:border-red-700 dark:bg-red-950/20 dark:text-red-400">
                [Failed to load album: {slug}]
            </div>
        );
    }

    return (
        <div className="my-8">
            <h3 className="text-xl font-semibold text-chestnut dark:text-dark-text mb-4">
                {result.data.title}
            </h3>
            <AlbumViewer images={result.data.formattedImages} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Public server-side renderer (used by app/posts/[slug]/page.tsx)
// ---------------------------------------------------------------------------

export async function renderWithShortcodes(markdown: string) {
    const parts = parseShortcodes(markdown, (type, identifier, key) => {
        if (type === "album") {
            return (
                <div key={key}>
                    <AlbumEmbed slug={identifier} />
                </div>
            );
        }
        return (
            <p key={key} className="text-copper">
                [Unknown shortcode: [[{type}:{identifier}]]]
            </p>
        );
    });

    return <>{parts}</>;
}
