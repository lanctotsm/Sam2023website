import { albums, images, posts } from "@/lib/db/schema";

type PostRow = typeof posts.$inferSelect;
type AlbumRow = typeof albums.$inferSelect;
type ImageRow = typeof images.$inferSelect;

export function serializePost(row: PostRow, options?: { inlineImageIds?: number[] }) {
  const base = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary || "",
    markdown: row.markdown,
    status: row.status,
    published_at: row.publishedAt ?? null,
    metadata: row.metadata ?? null,
    created_by: row.createdBy ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
  if (options?.inlineImageIds) {
    return {
      ...base,
      inline_image_ids: options.inlineImageIds
    };
  }
  return base;
}

export function serializeAlbum(row: AlbumRow & { coverImageS3Key?: string | null }) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || "",
    cover_image_s3_key: row.coverImageS3Key ?? null,
    created_by: row.createdBy ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

export function serializeImage(row: ImageRow) {
  return {
    id: row.id,
    s3_key: row.s3Key,
    s3_key_thumb: row.s3KeyThumb ?? null,
    s3_key_large: row.s3KeyLarge ?? null,
    s3_key_original: row.s3KeyOriginal ?? null,
    width: row.width,
    height: row.height,
    name: row.name || "",
    caption: row.caption || "",
    alt_text: row.altText || "",
    description: row.description || "",
    tags: row.tags || "",
    created_by: row.createdBy ?? null,
    created_at: row.createdAt
  };
}
