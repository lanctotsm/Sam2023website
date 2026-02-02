import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { getImagesInAlbum } from "@/services/album-images";
import { linkImageToAlbum } from "@/actions/albums";

export async function GET(_: Request, { params }: { params: Promise<{ albumID: string }> }) {
  const { albumID } = await params;
  const id = parseId(albumID);
  if (!id) {
    return errorResponse("invalid album id", 400);
  }

  try {
    const rows = await getImagesInAlbum(id);
    return NextResponse.json(rows.map(serializeImage));
  } catch (error) {
    return errorResponse("failed to fetch images", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ albumID: string }> }) {
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
  const imageId = Number(payload.image_id);
  if (!Number.isInteger(imageId) || imageId <= 0) {
    return errorResponse("image_id is required", 400);
  }

  const sortOrder = Number.isInteger(payload.sort_order) ? payload.sort_order : 0;

  try {
    await linkImageToAlbum({
      albumId: id,
      imageId,
      sortOrder
    });
    return NextResponse.json({ status: "linked" });
  } catch (error: any) {
    return errorResponse(error.message || "failed to link image", 400);
  }
}
