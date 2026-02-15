import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";
import { getAlbumBySlug } from "@/services/albums";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = (rawSlug || "").trim();
  if (!slug) {
    return errorResponse("missing slug", 400);
  }

  const row = await getAlbumBySlug(slug);
  if (!row) {
    return errorResponse("album not found", 404);
  }

  return NextResponse.json(serializeAlbum(row));
}
