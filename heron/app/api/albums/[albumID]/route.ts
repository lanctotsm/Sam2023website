import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { albums } from "@/lib/db/schema";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";

export async function GET(_: Request, { params }: { params: Promise<{ albumID: string }> }) {
  const { albumID } = await params;
  const id = parseId(albumID);
  if (!id) {
    return errorResponse("invalid album id", 400);
  }

  const row = await getDb().select().from(albums).where(eq(albums.id, id)).limit(1);
  if (!row[0]) {
    return errorResponse("album not found", 404);
  }

  return NextResponse.json(serializeAlbum(row[0]));
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

  const updated = await getDb()
    .update(albums)
    .set({
      title,
      slug,
      description: (payload.description || "").trim(),
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(albums.id, id))
    .returning();

  if (!updated[0]) {
    return errorResponse("album not found", 404);
  }

  return NextResponse.json(serializeAlbum(updated[0]));
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

  await getDb().delete(albums).where(eq(albums.id, id));
  return NextResponse.json({ status: "deleted" });
}
