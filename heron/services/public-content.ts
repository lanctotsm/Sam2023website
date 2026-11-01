import { cacheLife, cacheTag } from "next/cache";
import { PUBLIC_CONTENT_TAG } from "@/lib/revalidate-public";
import { nextScheduledPublicationMs } from "@/lib/public-cache-window";
import { serializeAlbum, serializeImage, serializePost } from "@/lib/serializers";
import { isPubliclyVisible } from "@/lib/posts-visibility";
import { getAlbumImages } from "@/services/albumImages";
import { getAlbumBySlug, getAllAlbums } from "@/services/albums";
import { getAllPosts, getPostBySlug } from "@/services/posts";

const HOUR_SECONDS = 3600;

/**
 * `hours` revalidates after an hour. A post scheduled sooner than that would
 * stay hidden until the entry revalidated, so the entry expires when the post
 * becomes public. `expire` has to be longer than `revalidate`.
 */
function cacheUntilPublication(nextChangeAtMs: number | null) {
  const seconds =
    nextChangeAtMs == null || Number.isNaN(nextChangeAtMs)
      ? null
      : Math.ceil((nextChangeAtMs - Date.now()) / 1000);

  if (seconds == null || seconds <= 0 || seconds >= HOUR_SECONDS) {
    cacheLife("hours");
    return;
  }

  const expire = Math.max(seconds, 2);
  cacheLife({
    stale: 30,
    revalidate: Math.floor(expire / 2),
    expire
  });
}

export async function getCachedPublicPosts() {
  "use cache";
  cacheTag(PUBLIC_CONTENT_TAG);
  const nextChangeAtMs = await nextScheduledPublicationMs();
  cacheUntilPublication(nextChangeAtMs);
  const rows = await getAllPosts({});
  return rows.map((row) => serializePost(row));
}

export async function getCachedPublicPost(slug: string) {
  "use cache";
  cacheTag(PUBLIC_CONTENT_TAG);
  const row = await getPostBySlug(slug);
  if (!row || !isPubliclyVisible(row)) {
    const nextChangeAtMs = row ? await nextScheduledPublicationMs(slug) : null;
    if (nextChangeAtMs == null) {
      cacheLife("minutes");
    } else {
      cacheUntilPublication(nextChangeAtMs);
    }
    return null;
  }
  cacheLife("hours");
  return serializePost(row);
}

export async function getCachedPublicAlbums() {
  "use cache";
  cacheTag(PUBLIC_CONTENT_TAG);
  cacheLife("hours");
  const rows = await getAllAlbums();
  return rows.map((row) => serializeAlbum(row));
}

export async function getCachedPublicAlbum(slug: string) {
  "use cache";
  cacheTag(PUBLIC_CONTENT_TAG);
  cacheLife("hours");
  const row = await getAlbumBySlug(slug);
  if (!row) return null;
  return serializeAlbum(row);
}

export async function getCachedAlbumImages(albumId: number) {
  "use cache";
  cacheTag(PUBLIC_CONTENT_TAG);
  cacheLife("hours");
  const rows = await getAlbumImages(albumId);
  return rows.map((row) => serializeImage(row));
}
