import { desc, eq, sql } from "drizzle-orm";
import { getDb, getRawDb } from "@/lib/db";
import { albums, posts } from "@/lib/db/schema";
import { normalizeStatus } from "@/lib/api-utils";
import { renderPostHtml } from "@/lib/render-post-html";

function albumEmbedLike(slug: string): string {
  const escaped = slug.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%[[album:${escaped}]]%`;
}

/** Re-render stored HTML for posts whose markdown embeds this album slug. */
export async function refreshPostsEmbeddingAlbum(slug: string): Promise<void> {
  const trimmed = slug.trim();
  if (!trimmed) return;

  const matches = getRawDb()
    .prepare("SELECT id, markdown FROM posts WHERE markdown LIKE ? ESCAPE '\\'")
    .all(albumEmbedLike(trimmed)) as { id: number; markdown: string }[];

  const db = getDb();
  for (const match of matches) {
    const html = await renderPostHtml(match.markdown);
    await db.update(posts).set({ html }).where(eq(posts.id, match.id));
  }
}

export async function refreshPostsEmbeddingAlbumId(albumId: number): Promise<void> {
  const rows = await getDb().select({ slug: albums.slug }).from(albums).where(eq(albums.id, albumId)).limit(1);
  const slug = rows[0]?.slug;
  if (slug) await refreshPostsEmbeddingAlbum(slug);
}

export async function getAllPosts(options: { user?: { id: number } | null; status?: string } = {}) {
  const db = getDb();
  const { user, status } = options;

  let query = db.select().from(posts).orderBy(desc(posts.createdAt));

  if (!user) {
    // Public view: only published posts whose published_at is in the past
    const now = new Date().toISOString();
    return query.where(
      sql`${posts.status} = 'published' AND (${posts.publishedAt} IS NULL OR ${posts.publishedAt} <= ${now})`
    );
  }

  if (status) {
    // Admin view with status filter
    return query.where(eq(posts.status, status));
  }

  return query;
}

export async function getPostBySlug(slug: string) {
  const db = getDb();
  const rows = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.html != null) return row;

  const html = await renderPostHtml(row.markdown);
  await db.update(posts).set({ html }).where(eq(posts.id, row.id));
  return { ...row, html };
}

export async function getPostById(id: number) {
  const rows = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] || null;
}

export async function createPost(data: {
  title: string;
  slug: string;
  summary?: string;
  markdown: string;
  status?: string;
  publishedAt?: string | null;
  metadata?: Record<string, string> | null;
  coverImageId?: number | null;
  createdBy: number;
}) {
  const html = await renderPostHtml(data.markdown);
  const created = await getDb()
    .insert(posts)
    .values({
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      markdown: data.markdown,
      html,
      status: normalizeStatus(data.status),
      publishedAt: data.publishedAt,
      metadata: data.metadata || {},
      coverImageId: data.coverImageId ?? null,
      createdBy: data.createdBy
    })
    .returning();

  return created[0];
}

export async function updatePost(
  id: number,
  data: {
    title: string;
    slug: string;
    summary?: string;
    markdown: string;
    status?: string;
    publishedAt?: string | null;
    metadata?: Record<string, string> | null;
    coverImageId?: number | null;
  }
) {
  const html = await renderPostHtml(data.markdown);
  const updated = await getDb()
    .update(posts)
    .set({
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      markdown: data.markdown,
      html,
      status: normalizeStatus(data.status),
      publishedAt: data.publishedAt,
      metadata: data.metadata || {},
      coverImageId: data.coverImageId ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(posts.id, id))
    .returning();

  return updated[0] || null;
}

export async function deletePost(id: number) {
  await getDb().delete(posts).where(eq(posts.id, id));
}
