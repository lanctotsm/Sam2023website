import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { albumImages, images } from "@/lib/db/schema";

export async function getImagesInAlbum(albumId: number) {
  return await getDb()
    .select({
      id: images.id,
      s3Key: images.s3Key,
      width: images.width,
      height: images.height,
      caption: images.caption,
      altText: images.altText,
      createdBy: images.createdBy,
      createdAt: images.createdAt
    })
    .from(images)
    .innerJoin(albumImages, eq(albumImages.imageId, images.id))
    .where(eq(albumImages.albumId, albumId))
    .orderBy(asc(albumImages.sortOrder), desc(images.createdAt));
}

export async function addImageToAlbum(albumId: number, imageId: number, sortOrder: number = 0) {
  await getDb()
    .insert(albumImages)
    .values({
      albumId,
      imageId,
      sortOrder
    })
    .onConflictDoUpdate({
      target: [albumImages.albumId, albumImages.imageId],
      set: { sortOrder }
    });
}

export async function removeImageFromAlbum(albumId: number, imageId: number) {
  await getDb()
    .delete(albumImages)
    .where(and(eq(albumImages.albumId, albumId), eq(albumImages.imageId, imageId)));
}
