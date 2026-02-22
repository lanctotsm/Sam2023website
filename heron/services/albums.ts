import { desc, eq, sql, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { albums, albumImages, images } from "@/lib/db/schema";

export async function getAllAlbums() {
  const db = getDb();

  // Subquery to find the first image for each album
  // Drizzle doesn't have a great way to do "DISTINCT ON" in SQLite easily with subqueries
  // so we'll fetch all and group or use a CTE if needed.
  // Actually, let's just fetch albums and then their first image.

  const albumRows = await db.select().from(albums).orderBy(desc(albums.createdAt));

  // For each album, find the first image
  const results = await Promise.all(albumRows.map(async (album) => {
    const firstImage = await db
      .select({ s3KeyThumb: images.s3KeyThumb, s3Key: images.s3Key })
      .from(albumImages)
      .innerJoin(images, eq(albumImages.imageId, images.id))
      .where(eq(albumImages.albumId, album.id))
      .orderBy(asc(albumImages.sortOrder), asc(images.id))
      .limit(1);

    return {
      ...album,
      coverImageS3Key: firstImage[0]?.s3KeyThumb || firstImage[0]?.s3Key || null
    };
  }));

  return results;
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
