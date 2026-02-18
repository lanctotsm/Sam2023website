import { getRawDb } from "@/lib/db";
import { getPostById } from "@/services/posts";
import { getAlbumById } from "@/services/albums";
import { serializePost } from "@/lib/serializers";
import { serializeAlbum } from "@/lib/serializers";

/** Search posts and albums by full-text. Returns only published posts. */
export async function searchFts(query: string) {
  const q = query.trim();
  if (!q) {
    return { posts: [], albums: [] };
  }

  const db = getRawDb();

  // FTS5: bind query to avoid injection
  const term = q;

  let postIds: number[] = [];
  let albumIds: number[] = [];

  try {
    const postRows = db.prepare("SELECT rowid AS id FROM posts_fts WHERE posts_fts MATCH ? LIMIT 20").all(term) as { id: number }[];
    postIds = postRows.map((r) => r.id);
  } catch {
    // Table might not exist yet or empty query
  }

  try {
    const albumRows = db.prepare("SELECT rowid AS id FROM albums_fts WHERE albums_fts MATCH ? LIMIT 20").all(term) as { id: number }[];
    albumIds = albumRows.map((r) => r.id);
  } catch {
    // Table might not exist yet
  }

  const [postRows, albumRows] = await Promise.all([
    Promise.all(postIds.map((id) => getPostById(id))),
    Promise.all(albumIds.map((id) => getAlbumById(id)))
  ]);

  const posts = postRows
    .filter((p): p is NonNullable<typeof p> => p != null && p.status === "published")
    .map((row) => serializePost(row));
  const albums = albumRows.filter((a): a is NonNullable<typeof a> => a != null).map(serializeAlbum);

  return { posts, albums };
}
