import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";

export async function GET(_: Request, { params }: { params: { imageID: string } }) {
  const id = parseId(params.imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  const row = await getDb().select().from(images).where(eq(images.id, id)).limit(1);
  if (!row[0]) {
    return errorResponse("image not found", 404);
  }

  return NextResponse.json(serializeImage(row[0]));
}

export async function PUT(request: Request, { params }: { params: { imageID: string } }) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(params.imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  const payload = await request.json();
  const s3Key = (payload.s3_key || "").trim();
  if (!s3Key) {
    return errorResponse("s3_key is required", 400);
  }

  const updated = await getDb()
    .update(images)
    .set({
      s3Key,
      width: payload.width ?? null,
      height: payload.height ?? null,
      caption: (payload.caption || "").trim(),
      altText: (payload.alt_text || "").trim()
    })
    .where(eq(images.id, id))
    .returning();

  if (!updated[0]) {
    return errorResponse("image not found", 404);
  }

  return NextResponse.json(serializeImage(updated[0]));
}

export async function DELETE(_: Request, { params }: { params: { imageID: string } }) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(params.imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  await getDb().delete(images).where(eq(images.id, id));
  return NextResponse.json({ status: "deleted" });
}
