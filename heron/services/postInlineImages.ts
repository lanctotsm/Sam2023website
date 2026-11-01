import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { postInlineImages } from "@/lib/db/schema";

export async function getPostInlineImageIds(postId: number): Promise<number[]> {
  const rows = await getDb()
    .select({ imageId: postInlineImages.imageId })
    .from(postInlineImages)
    .where(eq(postInlineImages.postId, postId));
  return rows.map((r) => r.imageId);
}

export async function replacePostInlineImages(postId: number, imageIds: number[]) {
  const db = getDb();
  const uniqueIds = Array.from(new Set(imageIds.filter((x) => Number.isInteger(x) && x > 0)));
  // better-sqlite3: transaction callback must be synchronous (see updateSettings).
  db.transaction((tx) => {
    tx.delete(postInlineImages).where(eq(postInlineImages.postId, postId)).run();
    if (uniqueIds.length === 0) return;
    tx.insert(postInlineImages).values(
      uniqueIds.map((imageId) => ({
        postId,
        imageId,
        source: "upload_insert"
      }))
    ).run();
  });
}

export async function isImageReferencedByAnyPost(imageId: number) {
  const remaining = await getDb()
    .select({ imageId: postInlineImages.imageId })
    .from(postInlineImages)
    .where(eq(postInlineImages.imageId, imageId));
  return remaining.length > 0;
}
