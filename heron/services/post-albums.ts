import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { postAlbumLinks } from "@/lib/db/schema";
import { getPostById } from "@/services/posts";
import { getAlbumById } from "@/services/albums";

export async function linkAlbumToPost(postId: number, albumId: number) {
  const [post, album] = await Promise.all([getPostById(postId), getAlbumById(albumId)]);

  if (!post) {
    throw new Error("post not found");
  }
  if (!album) {
    throw new Error("album not found");
  }

  await getDb()
    .insert(postAlbumLinks)
    .values({ postId, albumId })
    .onConflictDoNothing();
}

export async function unlinkAlbumFromPost(postId: number, albumId: number) {
  await getDb()
    .delete(postAlbumLinks)
    .where(and(eq(postAlbumLinks.postId, postId), eq(postAlbumLinks.albumId, albumId)));
}
