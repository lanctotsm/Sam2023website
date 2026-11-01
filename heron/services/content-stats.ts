import { getRawDb } from "@/lib/db";

export type ContentCounts = {
  posts: number;
  albums: number;
  images: number;
};

/** One round trip. The admin dashboard only needs the three totals. */
export function getContentCounts(): ContentCounts {
  const row = getRawDb()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM posts) AS posts,
         (SELECT COUNT(*) FROM albums) AS albums,
         (SELECT COUNT(*) FROM images) AS images`
    )
    .get() as ContentCounts | undefined;

  return {
    posts: Number(row?.posts ?? 0),
    albums: Number(row?.albums ?? 0),
    images: Number(row?.images ?? 0)
  };
}
