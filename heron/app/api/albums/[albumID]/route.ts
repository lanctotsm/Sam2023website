import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";
import { deleteAlbum, getAlbumById, updateAlbum } from "@/services/albums";

export async function GET(_: Request, { params }: { params: Promise<{ albumID: string }> }) {
  const { albumID } = await params;
  const id = parseId(albumID);
  if (!id) {
    return errorResponse("invalid album id", 400);
  }

  const row = await getAlbumById(id);
  if (!row) {
    return errorResponse("album not found", 404);
  }

  return NextResponse.json(serializeAlbum(row));
}

export async function PUT(request: Request, { params }: { params: Promise<{ albumID: string }> }) {
  const { albumID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(albumID);
  if (!id) {
    return errorResponse("invalid album id", 400);
  }

  const payload = await request.json();
  const title = (payload.title || "").trim();
  const slug = (payload.slug || "").trim();

  if (!title || !slug) {
    return errorResponse("title and slug are required", 400);
  }

  const updated = await updateAlbum(id, {
    title,
    slug,
    description: (payload.description || "").trim()
  });

  if (!updated) {
    return errorResponse("album not found", 404);
  }

  return NextResponse.json(serializeAlbum(updated));
}

export async function DELETE(_: Request, { params }: { params: Promise<{ albumID: string }> }) {
  const { albumID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(albumID);
  if (!id) {
    return errorResponse("invalid album id", 400);
  }

  await deleteAlbum(id);
  return NextResponse.json({ status: "deleted" });
}
