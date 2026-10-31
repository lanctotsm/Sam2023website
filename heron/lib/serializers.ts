import { albums, images, posts } from "@/lib/db/schema";

type PostRow = typeof posts.$inferSelect;
type AlbumRow = typeof albums.$inferSelect;
type ImageRow = typeof images.$inferSelect;

type PostInput = Omit<PostRow, "coverImageId" | "html"> & {
  coverImageId?: number | null;
  html?: string | null;
};

type AlbumInput = Omit<AlbumRow, "status" | "coverImageId" | "displayDate"> & {
  status?: string | null;
  coverImageId?: number | null;
  displayDate?: string | null;
  coverImageS3Key?: string | null;
  photoCount?: number | null;
};

export function serializePost(row: PostInput, options?: { inlineImageIds?: number[] }) {
  const base = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary || "",
    markdown: row.markdown,
    status: row.status,
    published_at: row.publishedAt ?? null,
    metadata: row.metadata ?? null,
    cover_image_id: row.coverImageId ?? null,
    html: row.html ?? null,
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

export function serializeAlbum(row: AlbumInput) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || "",
    status: row.status ?? "published",
    cover_image_id: row.coverImageId ?? null,
    display_date: row.displayDate ?? null,
    cover_image_s3_key: row.coverImageS3Key ?? null,
    photo_count: row.photoCount == null ? null : Number(row.photoCount),
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
    lqip: row.lqip ?? null,
    created_by: row.createdBy ?? null,
    created_at: row.createdAt
  };
}
