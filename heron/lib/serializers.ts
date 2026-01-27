import { albums, images, posts } from "@/lib/db/schema";

type PostRow = typeof posts.$inferSelect;
type AlbumRow = typeof albums.$inferSelect;
type ImageRow = typeof images.$inferSelect;

export function serializePost(row: PostRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary || "",
    markdown: row.markdown,
    status: row.status,
    published_at: row.publishedAt ?? null,
    created_by: row.createdBy ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

export function serializeAlbum(row: AlbumRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || "",
    created_by: row.createdBy ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

export function serializeImage(row: ImageRow) {
  return {
    id: row.id,
    s3_key: row.s3Key,
    width: row.width,
    height: row.height,
    caption: row.caption || "",
    alt_text: row.altText || "",
    created_by: row.createdBy ?? null,
    created_at: row.createdAt
  };
}
