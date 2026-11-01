import { unstable_cache } from "next/cache";
import { PUBLIC_CONTENT_TAG } from "@/lib/revalidate-public";
import {
  nextScheduledPublicationMs,
  PUBLIC_CACHE_MAX_SECONDS,
  publicCacheRevalidateSeconds,
  publicationWindowId
} from "@/lib/public-cache-window";
import { serializeAlbum, serializeImage, serializePost } from "@/lib/serializers";
import { isPubliclyVisible } from "@/lib/posts-visibility";
import { getAlbumImages } from "@/services/albumImages";
import { getAlbumBySlug, getAllAlbums } from "@/services/albums";
import { getAllPosts, getPostBySlug } from "@/services/posts";

const publicCache = {
  tags: [PUBLIC_CONTENT_TAG],
  revalidate: PUBLIC_CACHE_MAX_SECONDS
};

export async function getCachedPublicPosts() {
  const nextChangeAtMs = await nextScheduledPublicationMs();
  const revalidate = publicCacheRevalidateSeconds(nextChangeAtMs);
  return unstable_cache(async () => {
    const rows = await getAllPosts({});
    return rows.map((row) => serializePost(row));
  }, ["public-posts", publicationWindowId(nextChangeAtMs)], { ...publicCache, revalidate })();
}

export async function getCachedPublicPost(slug: string) {
  const nextChangeAtMs = await nextScheduledPublicationMs(slug);
  const revalidate = publicCacheRevalidateSeconds(nextChangeAtMs);
  return unstable_cache(async () => {
    const row = await getPostBySlug(slug);
    if (!row || !isPubliclyVisible(row)) return null;
    return serializePost(row);
  }, ["public-post", slug, publicationWindowId(nextChangeAtMs)], { ...publicCache, revalidate })();
}

export function getCachedPublicAlbums() {
  return unstable_cache(async () => {
    const rows = await getAllAlbums();
    return rows.map((row) => serializeAlbum(row));
  }, ["public-albums"], publicCache)();
}

export function getCachedPublicAlbum(slug: string) {
  return unstable_cache(async () => {
    const row = await getAlbumBySlug(slug);
    if (!row) return null;
    return serializeAlbum(row);
  }, ["public-album", slug], publicCache)();
}

export function getCachedAlbumImages(albumId: number) {
  return unstable_cache(async () => {
    const rows = await getAlbumImages(albumId);
    return rows.map((row) => serializeImage(row));
  }, ["album-images", String(albumId)], publicCache)();
}
