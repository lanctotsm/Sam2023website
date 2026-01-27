import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { albums } from "@/lib/db/schema";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";

export async function GET() {
  const rows = await getDb().select().from(albums).orderBy(desc(albums.createdAt));
  return NextResponse.json(rows.map(serializeAlbum));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const title = (payload.title || "").trim();
  const slug = (payload.slug || "").trim();

  if (!title || !slug) {
    return errorResponse("title and slug are required", 400);
  }

  const created = await getDb()
    .insert(albums)
    .values({
      title,
      slug,
      description: (payload.description || "").trim(),
      createdBy: user.id
    })
    .returning();

  return NextResponse.json(serializeAlbum(created[0]), { status: 201 });
}
