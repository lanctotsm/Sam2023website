import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { isAlbumPubliclyVisible } from "@/lib/album-visibility";
import { serializeAlbum } from "@/lib/serializers";
import { deleteAlbum, getAlbumById, updateAlbum } from "@/services/albums";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { displayDateValue, optionalImageId } from "@/lib/content-fields";

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

  const user = await getAuthUser();
  if (!user && !isAlbumPubliclyVisible(row)) {
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
    description: (payload.description || "").trim(),
    status: payload.status,
    displayDate: displayDateValue(payload.display_date),
    coverImageId: optionalImageId(payload.cover_image_id)
  });

  if (!updated) {
    return errorResponse("album not found", 404);
  }

  revalidatePublicContent();
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
  revalidatePublicContent();
  return NextResponse.json({ status: "deleted" });
}
