import { getRawDb } from "@/lib/db";
import { isAlbumPubliclyVisible } from "@/lib/album-visibility";
import { isPubliclyVisible } from "@/lib/posts-visibility";
import { serializeAlbum, serializePost } from "@/lib/serializers";

const MAX_SEARCH_QUERY_LENGTH = 100;

type PostHit = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  markdown: string;
  status: string;
  publishedAt: string | null;
  metadata: string | Record<string, string> | null;
  coverImageId: number | null;
  html: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
};

type AlbumHit = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  coverImageId: number | null;
  displayDate: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
};

function parseMetadata(value: PostHit["metadata"]): Record<string, string> | null {
  if (value == null || value === "") return null;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    return null;
  }
  return null;
}

/** Search posts and albums by full-text. Returns only published posts and albums. */
export async function searchFts(query: string) {
  const q = query.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
  if (!q) {
    return { posts: [], albums: [] };
  }

  const db = getRawDb();
  let postHits: PostHit[] = [];
  let albumHits: AlbumHit[] = [];

  try {
    postHits = db
      .prepare(
        `SELECT posts.id, posts.title, posts.slug, posts.summary, posts.markdown, posts.status,
                posts.published_at AS publishedAt, posts.metadata, posts.cover_image_id AS coverImageId,
                posts.html, posts.created_by AS createdBy, posts.created_at AS createdAt,
                posts.updated_at AS updatedAt
         FROM posts_fts
         INNER JOIN posts ON posts.id = posts_fts.rowid
         WHERE posts_fts MATCH ?
         LIMIT 20`
      )
      .all(q) as PostHit[];
  } catch {
    // Table might not exist yet or the query is not valid FTS syntax.
  }

  try {
    albumHits = db
      .prepare(
        `SELECT albums.id, albums.title, albums.slug, albums.description, albums.status,
                albums.cover_image_id AS coverImageId, albums.display_date AS displayDate,
                albums.created_by AS createdBy, albums.created_at AS createdAt,
                albums.updated_at AS updatedAt
         FROM albums_fts
         INNER JOIN albums ON albums.id = albums_fts.rowid
         WHERE albums_fts MATCH ?
         LIMIT 20`
      )
      .all(q) as AlbumHit[];
  } catch {
    // Table might not exist yet.
  }

  const posts = postHits
    .filter((row) => isPubliclyVisible(row))
    .map((row) =>
      serializePost({
        ...row,
        metadata: parseMetadata(row.metadata)
      })
    );

  const albums = albumHits.filter((row) => isAlbumPubliclyVisible(row)).map((row) => serializeAlbum(row));

  return { posts, albums };
}
