import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const slug = (params.slug || "").trim();
  if (!slug) {
    return errorResponse("missing slug", 400);
  }

  const row = await getDb().select().from(posts).where(eq(posts.slug, slug)).limit(1);
  if (!row[0]) {
    return errorResponse("post not found", 404);
  }

  const user = await getAuthUser();
  if (!user && row[0].status !== "published") {
    return errorResponse("post not found", 404);
  }

  return NextResponse.json(serializePost(row[0]));
}
