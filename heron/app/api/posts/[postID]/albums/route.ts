import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { isPubliclyVisible } from "@/lib/posts-visibility";
import { serializeAlbum } from "@/lib/serializers";
import { getPostById } from "@/services/posts";
import { getAlbumsForPost, linkAlbumToPost } from "@/services/post-albums";

export async function GET(_: Request, { params }: { params: Promise<{ postID: string }> }) {
  const { postID } = await params;
  const id = parseId(postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  const row = await getPostById(id);
  const user = await getAuthUser();
  if (!row || (!user && !isPubliclyVisible(row))) {
    return errorResponse("post not found", 404);
  }

  const rows = await getAlbumsForPost(id);
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

  try {
    await linkAlbumToPost(id, albumId);
    return NextResponse.json({ status: "linked" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to link album";
    return errorResponse(message, 400);
  }
}
