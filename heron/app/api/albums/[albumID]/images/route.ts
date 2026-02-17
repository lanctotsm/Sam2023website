import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { getAlbumById } from "@/services/albums";
import { addAlbumImage, getAlbumImages, updateAlbumImagesOrder } from "@/services/albumImages";

type Params = { params: Promise<{ albumID: string }> };

export async function GET(_: Request, { params }: Params) {
  const { albumID } = await params;
  const albumId = parseInt(albumID, 10);
  if (Number.isNaN(albumId)) {
    return errorResponse("invalid album id", 400);
  }

  const album = await getAlbumById(albumId);
  if (!album) {
    return errorResponse("album not found", 404);
  }

  const rows = await getAlbumImages(albumId);
  const body = rows.map((row) => ({
    ...serializeImage(row),
    sort_order: row.sortOrder
  }));
  return NextResponse.json(body);
}

export async function POST(request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const { albumID } = await params;
  const albumId = parseInt(albumID, 10);
  if (Number.isNaN(albumId)) {
    return errorResponse("invalid album id", 400);
  }

  const album = await getAlbumById(albumId);
  if (!album) {
    return errorResponse("album not found", 404);
  }

  const payload = await request.json();
  const imageId = Number(payload.image_id);
  const sortOrder = Number(payload.sort_order);
  if (!Number.isInteger(imageId) || imageId <= 0 || !Number.isInteger(sortOrder) || sortOrder < 0) {
    return errorResponse("image_id and sort_order (non-negative integers) are required", 400);
  }

  await addAlbumImage(albumId, imageId, sortOrder);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PUT(request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const { albumID } = await params;
  const albumId = parseInt(albumID, 10);
  if (Number.isNaN(albumId)) {
    return errorResponse("invalid album id", 400);
  }

  const album = await getAlbumById(albumId);
  if (!album) {
    return errorResponse("album not found", 404);
  }

  const payload = await request.json();
  const order = payload.order;
  if (!Array.isArray(order) || order.some((x) => typeof x !== "number")) {
    return errorResponse("order must be an array of image ids", 400);
  }

  await updateAlbumImagesOrder(albumId, order);
  return NextResponse.json({ ok: true });
}
