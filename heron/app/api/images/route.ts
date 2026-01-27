import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const rows = await getDb().select().from(images).orderBy(desc(images.createdAt));
  return NextResponse.json(rows.map(serializeImage));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const s3Key = (payload.s3_key || "").trim();
  if (!s3Key) {
    return errorResponse("s3_key is required", 400);
  }

  const created = await getDb()
    .insert(images)
    .values({
      s3Key,
      width: payload.width ?? null,
      height: payload.height ?? null,
      caption: (payload.caption || "").trim(),
      altText: (payload.alt_text || "").trim(),
      createdBy: user.id
    })
    .returning();

  return NextResponse.json(serializeImage(created[0]), { status: 201 });
}
