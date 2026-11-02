import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import type { PostWriteData } from "@/lib/post-input";
import { replacePostInlineImagesInTransaction } from "./postInlineImages";

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
  const rows = await getDb().select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function getPostById(id: number) {
  const rows = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] || null;
}

export async function createPost(data: PostWriteData & { createdBy: number }) {
  const { inlineImageIds, ...postData } = data;
  return getDb().transaction((tx) => {
    const created = tx.insert(posts).values({ ...postData, metadata: data.metadata || {} }).returning().get();
    if (inlineImageIds !== undefined) {
      replacePostInlineImagesInTransaction(tx, created.id, inlineImageIds);
    }
    return created;
  });
}

export async function updatePost(
  id: number,
  data: PostWriteData
) {
  const { inlineImageIds, ...postData } = data;
  return getDb().transaction((tx) => {
    const updated = tx.update(posts)
      .set({ ...postData, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(posts.id, id)).returning().get();
    if (!updated) return null;
    if (inlineImageIds !== undefined) {
      replacePostInlineImagesInTransaction(tx, id, inlineImageIds);
    }
    return updated;
  });
}

export async function deletePost(id: number) {
  await getDb().delete(posts).where(eq(posts.id, id));
}
