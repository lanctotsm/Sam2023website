import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { deleteImage, getImageById, updateImage } from "@/services/images";
import { deleteObjects } from "@/lib/s3";

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
    name: (payload.name || "").trim(),
    caption: (payload.caption || "").trim(),
    altText: (payload.alt_text || "").trim(),
    description: (payload.description || "").trim(),
    tags: (payload.tags || "").trim()
  });

  if (!updated) {
    return errorResponse("image not found", 404);
  }

  return NextResponse.json(serializeImage(updated));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ imageID: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const { imageID } = await params;
  const id = parseId(imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  const payload = await request.json();
  const updateData: {
    name?: string;
    caption?: string;
    altText?: string;
    description?: string;
    tags?: string;
  } = {};
  if (payload.name !== undefined) {
    updateData.name = (payload.name || "").trim();
  }
  if (payload.caption !== undefined) {
    updateData.caption = (payload.caption || "").trim();
  }
  if (payload.alt_text !== undefined) {
    updateData.altText = (payload.alt_text || "").trim();
  }
  if (payload.description !== undefined) {
    updateData.description = (payload.description || "").trim();
  }
  if (payload.tags !== undefined) {
    updateData.tags = (payload.tags || "").trim();
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse("at least one of name, caption, alt_text, description, tags is required", 400);
  }

  const row = await getImageById(id);
  if (!row) {
    return errorResponse("image not found", 404);
  }

  const updated = await updateImage(id, updateData);
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

  const row = await getImageById(id);
  if (!row) {
    return errorResponse("image not found", 404);
  }

  const keys: string[] = [];
  for (const key of [row.s3Key, row.s3KeyThumb, row.s3KeyLarge, row.s3KeyOriginal]) {
    if (key && typeof key === "string") {
      keys.push(key.replace(/^\//, ""));
    }
  }
  if (keys.length > 0) {
    await deleteObjects(keys);
  }
  await deleteImage(id);
  return NextResponse.json({ status: "deleted" });
}
