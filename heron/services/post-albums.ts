import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { albums, postAlbumLinks } from "@/lib/db/schema";

export async function getAlbumsForPost(postId: number) {
  return await getDb()
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      description: albums.description,
      createdBy: albums.createdBy,
      createdAt: albums.createdAt,
      updatedAt: albums.updatedAt
    })
    .from(albums)
    .innerJoin(postAlbumLinks, eq(postAlbumLinks.albumId, albums.id))
    .where(eq(postAlbumLinks.postId, postId))
    .orderBy(desc(albums.createdAt));
}

export async function linkAlbumToPost(postId: number, albumId: number) {
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
