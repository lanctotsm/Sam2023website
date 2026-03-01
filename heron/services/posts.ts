import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { normalizeStatus } from "@/lib/api-utils";

export async function getAllPosts(options: { user?: any; status?: string } = {}) {
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
  const rows = await getDb().select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return rows[0] || null;
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
  createdBy: number;
}) {
  const created = await getDb()
    .insert(posts)
    .values({
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      markdown: data.markdown,
      status: normalizeStatus(data.status),
      publishedAt: data.publishedAt,
      metadata: data.metadata || {},
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
  }
) {
  const updated = await getDb()
    .update(posts)
    .set({
      ...data,
      status: normalizeStatus(data.status),
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(posts.id, id))
    .returning();

  return updated[0] || null;
}

export async function deletePost(id: number) {
  await getDb().delete(posts).where(eq(posts.id, id));
}
