import { linkAlbumToPost as linkAlbumToPostService } from "@/services/post-albums";
import { getPostById } from "@/services/posts";
import { getAlbumById } from "@/services/albums";

export async function linkAlbumToPost(params: { postId: number; albumId: number }) {
  const { postId, albumId } = params;

  const [post, album] = await Promise.all([getPostById(postId), getAlbumById(albumId)]);

  if (!post) {
    throw new Error("post not found");
  }
  if (!album) {
    throw new Error("album not found");
  }

  await linkAlbumToPostService(postId, albumId);
}
