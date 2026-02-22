import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDb } from "@/lib/db";
import { albums, albumImages, images } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import AlbumViewer from "@/components/AlbumViewer";

const SHORTCODE_REGEX = /\[\[(\w+):([\w-]+)\]\]/g;

async function AlbumEmbed({ slug }: { slug: string }) {
    const db = getDb();

    // Find album
    const albumRows = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
    const album = albumRows[0];

    if (!album) {
        return (
            <div className="rounded-xl border border-copper bg-copper/5 p-4 text-center text-copper dark:border-copper/50">
                [Album not found: {slug}]
            </div>
        );
    }

    // Fetch images for album
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

    return (
        <div className="my-8">
            <h3 className="text-xl font-semibold text-chestnut dark:text-dark-text mb-4">
                {album.title}
            </h3>
            <AlbumViewer images={formattedImages} />
        </div>
    );
}

export async function renderWithShortcodes(markdown: string) {
    const parts = [];
    let lastIndex = 0;
    let match;

    // Reset regex state
    SHORTCODE_REGEX.lastIndex = 0;

    let keyCounter = 0;

    while ((match = SHORTCODE_REGEX.exec(markdown)) !== null) {
        const textBefore = markdown.slice(lastIndex, match.index);
        if (textBefore.trim()) {
            parts.push(
                <ReactMarkdown key={`md-${keyCounter++}`} remarkPlugins={[remarkGfm]}>
                    {textBefore}
                </ReactMarkdown>
            );
        }

        const type = match[1];
        const identifier = match[2];

        if (type === "album") {
            parts.push(
                <div key={`shortcode-${keyCounter++}`}>
                    <AlbumEmbed slug={identifier} />
                </div>
            );
        } else {
            // Unknown shortcode, render as text
            parts.push(
                <p key={`unknown-${keyCounter++}`} className="text-copper">
                    [Unknown shortcode: {match[0]}]
                </p>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    const textAfter = markdown.slice(lastIndex);
    if (textAfter.trim()) {
        parts.push(
            <ReactMarkdown key={`md-${keyCounter++}`} remarkPlugins={[remarkGfm]}>
                {textAfter}
            </ReactMarkdown>
        );
    }

    return <>{parts}</>;
}
