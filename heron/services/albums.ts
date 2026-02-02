import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { albums } from "@/lib/db/schema";

export async function getAllAlbums() {
  return await getDb().select().from(albums).orderBy(desc(albums.createdAt));
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
