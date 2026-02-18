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
  s3KeyThumb?: string | null;
  s3KeyLarge?: string | null;
  s3KeyOriginal?: string | null;
  width?: number | null;
  height?: number | null;
  name?: string;
  caption?: string;
  altText?: string;
  description?: string;
  tags?: string;
  createdBy: number;
}) {
  const created = await getDb()
    .insert(images)
    .values({
      s3Key: data.s3Key,
      s3KeyThumb: data.s3KeyThumb ?? null,
      s3KeyLarge: data.s3KeyLarge ?? null,
      s3KeyOriginal: data.s3KeyOriginal ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      name: (data.name || "").trim(),
      caption: (data.caption || "").trim(),
      altText: (data.altText || "").trim(),
      description: (data.description || "").trim(),
      tags: (data.tags || "").trim(),
      createdBy: data.createdBy
    })
    .returning();

  return created[0];
}

export async function updateImage(
  id: number,
  data: {
    s3Key?: string;
    s3KeyThumb?: string | null;
    s3KeyLarge?: string | null;
    s3KeyOriginal?: string | null;
    width?: number | null;
    height?: number | null;
    name?: string;
    caption?: string;
    altText?: string;
    description?: string;
    tags?: string;
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

/** Return all S3 keys referenced in the images table (for orphan cleanup). */
export async function getAllImageS3Keys(): Promise<Set<string>> {
  const rows = await getDb().select({
    s3Key: images.s3Key,
    s3KeyThumb: images.s3KeyThumb,
    s3KeyLarge: images.s3KeyLarge,
    s3KeyOriginal: images.s3KeyOriginal
  }).from(images);
  const set = new Set<string>();
  for (const row of rows) {
    for (const key of [row.s3Key, row.s3KeyThumb, row.s3KeyLarge, row.s3KeyOriginal]) {
      if (key && typeof key === "string") {
        set.add(key.replace(/^\//, ""));
      }
    }
  }
  return set;
}
