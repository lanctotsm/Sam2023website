import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { albums, albumImages, images } from "@/lib/db/schema";

export async function getAllAlbums() {
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

  return db
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      description: albums.description,
      createdBy: albums.createdBy,
      createdAt: albums.createdAt,
      updatedAt: albums.updatedAt,
      // Prefer thumbnail key for performance; fall back to full-size key if no thumbnail exists.
      coverImageS3Key: sql<string | null>`COALESCE(${coverImageSubquery.s3KeyThumb}, ${coverImageSubquery.s3Key})`
    })
    .from(albums)
    .leftJoin(
      coverImageSubquery,
      and(
        eq(coverImageSubquery.albumId, albums.id),
        eq(coverImageSubquery.rowNum, 1)
      )
    )
    .orderBy(desc(albums.createdAt));
}

export async function getAlbumBySlug(slug: string) {
  const rows = await getDb().select().from(albums).where(eq(albums.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function getAlbumById(id: number) {
  const rows = await getDb().select().from(albums).where(eq(albums.id, id)).limit(1);
  return rows[0] || null;
}

export async function createAlbum(data: {
  title: string;
  slug: string;
  description?: string;
  createdBy: number;
}) {
  const created = await getDb()
    .insert(albums)
    .values({
      title: data.title,
      slug: data.slug,
      description: data.description,
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
  }
) {
  const updated = await getDb()
    .update(albums)
    .set({
      ...data,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(albums.id, id))
    .returning();

  return updated[0] || null;
}

export async function deleteAlbum(id: number) {
  await getDb().delete(albums).where(eq(albums.id, id));
}
