import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";

/** Upper bound for public post and album caches. Matches the page `revalidate` exports. */
export const PUBLIC_CACHE_MAX_SECONDS = 3600;

/**
 * How long a public cache entry may live without hiding a scheduled publication.
 * A one-hour TTL filled just before `published_at` would keep the post off the
 * list and the detail page empty until that hour elapsed. The page ISR window
 * follows this value because `unstable_cache` shrinks the render revalidate.
 */
export function publicCacheRevalidateSeconds(
  nextChangeAtMs: number | null,
  nowMs: number = Date.now()
): number {
  if (nextChangeAtMs == null || Number.isNaN(nextChangeAtMs)) {
    return PUBLIC_CACHE_MAX_SECONDS;
  }
  const deltaSeconds = Math.ceil((nextChangeAtMs - nowMs) / 1000);
  if (deltaSeconds <= 0) return PUBLIC_CACHE_MAX_SECONDS;
  return Math.min(PUBLIC_CACHE_MAX_SECONDS, deltaSeconds);
}

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
