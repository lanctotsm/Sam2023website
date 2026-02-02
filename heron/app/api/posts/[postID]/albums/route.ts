import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { albums, postAlbumLinks } from "@/lib/db/schema";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";

export async function GET(_: Request, { params }: { params: Promise<{ postID: string }> }) {
  const { postID } = await params;
  const id = parseId(postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  const rows = await getDb()
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      description: albums.description,
      createdBy: albums.createdBy,
      createdAt: albums.createdAt,
      updatedAt: albums.updatedAt
    })
    .from(albums)
    .innerJoin(postAlbumLinks, eq(postAlbumLinks.albumId, albums.id))
    .where(eq(postAlbumLinks.postId, id))
    .orderBy(desc(albums.createdAt));

  return NextResponse.json(rows.map(serializeAlbum));
}

export async function POST(request: Request, { params }: { params: Promise<{ postID: string }> }) {
  const { postID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  const payload = await request.json();
  const albumId = Number(payload.album_id);
  if (!Number.isInteger(albumId) || albumId <= 0) {
    return errorResponse("album_id is required", 400);
  }

  await getDb()
    .insert(postAlbumLinks)
    .values({ postId: id, albumId })
    .onConflictDoNothing();

  return NextResponse.json({ status: "linked" });
}
