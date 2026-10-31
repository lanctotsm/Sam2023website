import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { albums, albumImages, images } from "@/lib/db/schema";
import { refreshPostsEmbeddingAlbum } from "@/services/posts";

export async function getAllAlbums(options: { includeDrafts?: boolean } = {}) {
  const db = getDb();

  // Single query: use a subquery with ROW_NUMBER() to pick the first image per album,
  // then LEFT JOIN it to albums to avoid an N+1 query pattern.
  const coverImageSubquery = db
    .select({
      albumId: albumImages.albumId,
      s3KeyThumb: images.s3KeyThumb,
      s3Key: images.s3Key,
      rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${albumImages.albumId} ORDER BY ${albumImages.sortOrder} ASC, ${images.id} ASC)`.as("row_num")
    })
    .from(albumImages)
    .innerJoin(images, eq(albumImages.imageId, images.id))
    .as("cover_images");

  const coverImageS3Key = sql<string | null>`COALESCE(
    (SELECT COALESCE(cover.s3_key_thumb, cover.s3_key) FROM ${images} AS cover WHERE cover.id = ${albums.coverImageId}),
    COALESCE(${coverImageSubquery.s3KeyThumb}, ${coverImageSubquery.s3Key})
  )`;

  const selection = {
    id: albums.id,
    title: albums.title,
    slug: albums.slug,
    description: albums.description,
    status: albums.status,
    coverImageId: albums.coverImageId,
    displayDate: albums.displayDate,
    createdBy: albums.createdBy,
    createdAt: albums.createdAt,
    updatedAt: albums.updatedAt,
    coverImageS3Key,
    photoCount: sql<number>`(SELECT COUNT(*) FROM ${albumImages} WHERE ${albumImages.albumId} = ${albums.id})`.mapWith(Number)
  };

  const joined = db
    .select(selection)
    .from(albums)
    .leftJoin(
      coverImageSubquery,
      and(
        eq(coverImageSubquery.albumId, albums.id),
        eq(coverImageSubquery.rowNum, 1)
      )
    );

  if (options.includeDrafts) {
    return joined.orderBy(desc(albums.createdAt));
  }

  return joined.where(eq(albums.status, "published")).orderBy(desc(albums.createdAt));
}

export async function getAlbumBySlug(slug: string) {
  const rows = await getDb().select().from(albums).where(eq(albums.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function getAlbumById(id: number) {
  const rows = await getDb().select().from(albums).where(eq(albums.id, id)).limit(1);
  return rows[0] || null;
}

function albumStatus(status?: string | null): string {
  const value = (status || "").trim().toLowerCase();
  if (value === "draft" || value === "archived") return value;
  return "published";
}

export async function createAlbum(data: {
  title: string;
  slug: string;
  description?: string;
  status?: string | null;
  displayDate?: string | null;
  coverImageId?: number | null;
  createdBy: number;
}) {
  const created = await getDb()
    .insert(albums)
    .values({
      title: data.title,
      slug: data.slug,
      description: data.description,
      status: albumStatus(data.status),
      displayDate: data.displayDate ?? null,
      coverImageId: data.coverImageId ?? null,
      createdBy: data.createdBy
    })
    .returning();

  return created[0];
}

export async function updateAlbum(
  id: number,
  data: {
    title: string;
    slug: string;
    description?: string;
    status?: string | null;
    displayDate?: string | null;
    coverImageId?: number | null;
  }
) {
  const existing = await getAlbumById(id);
  const updated = await getDb()
    .update(albums)
    .set({
      title: data.title,
      slug: data.slug,
      description: data.description,
      status: albumStatus(data.status),
      displayDate: data.displayDate ?? null,
      coverImageId: data.coverImageId ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(albums.id, id))
    .returning();

  const saved = updated[0];
  if (!saved) return null;

  try {
    if (existing?.slug) await refreshPostsEmbeddingAlbum(existing.slug);
    if (saved.slug !== existing?.slug) await refreshPostsEmbeddingAlbum(saved.slug);
  } catch (error) {
    console.error("Failed to refresh posts embedding album", id, error);
  }

  return saved;
}

export async function deleteAlbum(id: number) {
  await getDb().delete(albums).where(eq(albums.id, id));
}
