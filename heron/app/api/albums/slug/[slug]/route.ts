import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { albums } from "@/lib/db/schema";
import { errorResponse } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = (rawSlug || "").trim();
  if (!slug) {
    return errorResponse("missing slug", 400);
  }

  const row = await getDb().select().from(albums).where(eq(albums.slug, slug)).limit(1);
  if (!row[0]) {
    return errorResponse("album not found", 404);
  }

  return NextResponse.json(serializeAlbum(row[0]));
}
