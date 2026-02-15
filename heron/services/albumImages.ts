import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { albumImages, images } from "@/lib/db/schema";

export async function getAlbumImages(albumId: number) {
  const rows = await getDb()
    .select({
      id: images.id,
      s3Key: images.s3Key,
      width: images.width,
      height: images.height,
      caption: images.caption,
      altText: images.altText,
      createdBy: images.createdBy,
      createdAt: images.createdAt,
      sortOrder: albumImages.sortOrder
    })
    .from(albumImages)
    .innerJoin(images, eq(albumImages.imageId, images.id))
    .where(eq(albumImages.albumId, albumId))
    .orderBy(asc(albumImages.sortOrder));

  return rows;
}

export async function updateAlbumImagesOrder(albumId: number, imageIdsInOrder: number[]) {
  const db = getDb();
  for (let i = 0; i < imageIdsInOrder.length; i++) {
    await db
      .update(albumImages)
      .set({ sortOrder: i })
      .where(and(eq(albumImages.albumId, albumId), eq(albumImages.imageId, imageIdsInOrder[i])));
  }
}
