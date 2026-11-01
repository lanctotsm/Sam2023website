import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";

/** Soonest future `published_at` among published posts, optionally for one slug. */
export async function nextScheduledPublicationMs(slug?: string): Promise<number | null> {
  const now = new Date().toISOString();
  const conditions = [eq(posts.status, "published"), sql`${posts.publishedAt} > ${now}`];
  if (slug) conditions.push(eq(posts.slug, slug));

  const rows = await getDb()
    .select({ publishedAt: posts.publishedAt })
    .from(posts)
    .where(and(...conditions))
    .orderBy(asc(posts.publishedAt))
    .limit(1);

  const value = rows[0]?.publishedAt;
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}
