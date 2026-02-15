import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { deleteImage, getImageById, updateImage } from "@/services/images";

export async function GET(_: Request, { params }: { params: Promise<{ imageID: string }> }) {
  const { imageID } = await params;
  const id = parseId(imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  const row = await getImageById(id);
  if (!row) {
    return errorResponse("image not found", 404);
  }

  return NextResponse.json(serializeImage(row));
}

export async function PUT(request: Request, { params }: { params: Promise<{ imageID: string }> }) {
  const { imageID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  const payload = await request.json();
  const s3Key = (payload.s3_key || "").trim();
  if (!s3Key) {
    return errorResponse("s3_key is required", 400);
  }

  const updated = await updateImage(id, {
    s3Key,
    width: payload.width ?? null,
    height: payload.height ?? null,
    caption: (payload.caption || "").trim(),
    altText: (payload.alt_text || "").trim()
  });

  if (!updated) {
    return errorResponse("image not found", 404);
  }

  return NextResponse.json(serializeImage(updated));
}

export async function DELETE(_: Request, { params }: { params: Promise<{ imageID: string }> }) {
  const { imageID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  await deleteImage(id);
  return NextResponse.json({ status: "deleted" });
}
