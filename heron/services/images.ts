import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { images } from "@/lib/db/schema";

export async function getAllImages() {
  return await getDb().select().from(images).orderBy(desc(images.createdAt));
}

export async function getImageById(id: number) {
  const rows = await getDb().select().from(images).where(eq(images.id, id)).limit(1);
  return rows[0] || null;
}

export async function createImage(data: {
  s3Key: string;
  width?: number | null;
  height?: number | null;
  caption?: string;
  altText?: string;
  createdBy: number;
}) {
  const created = await getDb()
    .insert(images)
    .values({
      s3Key: data.s3Key,
      width: data.width ?? null,
      height: data.height ?? null,
      caption: (data.caption || "").trim(),
      altText: (data.altText || "").trim(),
      createdBy: data.createdBy
    })
    .returning();

  return created[0];
}

export async function updateImage(
  id: number,
  data: {
    s3Key?: string;
    width?: number | null;
    height?: number | null;
    caption?: string;
    altText?: string;
  }
) {
  const updated = await getDb()
    .update(images)
    .set(data)
    .where(eq(images.id, id))
    .returning();

  return updated[0] || null;
}

export async function deleteImage(id: number) {
  await getDb().delete(images).where(eq(images.id, id));
}
