import { unstable_cache } from "next/cache";
import { inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { PUBLIC_CONTENT_TAG } from "@/lib/revalidate-public";
import { serializeAlbum, serializeImage, serializePost } from "@/lib/serializers";
import { isAlbumPubliclyVisible } from "@/lib/album-visibility";
import { isPubliclyVisible } from "@/lib/posts-visibility";
import { getAlbumImages } from "@/services/albumImages";
import { getAlbumBySlug, getAllAlbums } from "@/services/albums";
import { getAllPosts, getPostBySlug } from "@/services/posts";

type CoverArt = { thumb: string | null; large: string | null };

async function coverArtById(ids: Array<number | null | undefined>): Promise<Map<number, CoverArt>> {
  const unique = [...new Set(ids.filter((id): id is number => typeof id === "number" && id > 0))];
  const map = new Map<number, CoverArt>();
  if (unique.length === 0) return map;
  const rows = await getDb()
    .select({
      id: images.id,
      key: images.s3Key,
      thumb: images.s3KeyThumb,
      large: images.s3KeyLarge
    })
    .from(images)
    .where(inArray(images.id, unique));
  for (const row of rows) {
    map.set(row.id, {
      thumb: row.thumb || row.key,
      large: row.large || row.key
    });
  }
  return map;
}

function withCover<T extends { cover_image_id?: number | null }>(post: T, art: Map<number, CoverArt>) {
  const cover = post.cover_image_id ? art.get(post.cover_image_id) : undefined;
  return {
    ...post,
    cover_image_s3_key: cover?.thumb ?? null,
    cover_image_large_key: cover?.large ?? null
  };
}

const publicCache = {
  tags: [PUBLIC_CONTENT_TAG],
  revalidate: 3600
};

export function getCachedPublicPosts() {
  return unstable_cache(async () => {
    const rows = await getAllPosts({});
    const art = await coverArtById(rows.map((row) => row.coverImageId));
    return rows.map((row) => withCover(serializePost(row), art));
  }, ["public-posts-with-cover"], publicCache)();
}

export function getCachedPublicPost(slug: string) {
  return unstable_cache(async () => {
    const row = await getPostBySlug(slug);
    if (!row || !isPubliclyVisible(row)) return null;
    const art = await coverArtById([row.coverImageId]);
    return withCover(serializePost(row), art);
  }, ["public-post-with-cover", slug], publicCache)();
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
    if (!row || !isAlbumPubliclyVisible(row)) return null;
    return serializeAlbum(row);
  }, ["public-album", slug], publicCache)();
}

export function getCachedAlbumImages(albumId: number) {
  return unstable_cache(async () => {
    const rows = await getAlbumImages(albumId);
    return rows.map((row) => serializeImage(row));
  }, ["album-images", String(albumId)], publicCache)();
}
