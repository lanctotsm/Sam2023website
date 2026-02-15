import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";
import { getPostBySlug } from "@/services/posts";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = (rawSlug || "").trim();
  if (!slug) {
    return errorResponse("missing slug", 400);
  }

  const row = await getPostBySlug(slug);
  if (!row) {
    return errorResponse("post not found", 404);
  }

  const user = await getAuthUser();
  if (!user && row.status !== "published") {
    return errorResponse("post not found", 404);
  }

  return NextResponse.json(serializePost(row));
}
