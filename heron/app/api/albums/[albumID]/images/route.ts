import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { albumImages, images } from "@/lib/db/schema";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";

export async function GET(_: Request, { params }: { params: Promise<{ albumID: string }> }) {
  const { albumID } = await params;
  const id = parseId(albumID);
  if (!id) {
    return errorResponse("invalid album id", 400);
  }

  const rows = await getDb()
    .select({
      id: images.id,
      s3Key: images.s3Key,
      width: images.width,
      height: images.height,
      caption: images.caption,
      altText: images.altText,
      createdBy: images.createdBy,
      createdAt: images.createdAt
    })
    .from(images)
    .innerJoin(albumImages, eq(albumImages.imageId, images.id))
    .where(eq(albumImages.albumId, id))
    .orderBy(asc(albumImages.sortOrder), desc(images.createdAt));

  return NextResponse.json(rows.map(serializeImage));
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

  await getDb()
    .insert(albumImages)
    .values({
      albumId: id,
      imageId,
      sortOrder
    })
    .onConflictDoUpdate({
      target: [albumImages.albumId, albumImages.imageId],
      set: { sortOrder }
    });

  return NextResponse.json({ status: "linked" });
}
