import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { errorResponse, getAuthUser, normalizeStatus, parseId } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";

export async function GET(_: Request, { params }: { params: { postID: string } }) {
  const id = parseId(params.postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  const row = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row[0]) {
    return errorResponse("post not found", 404);
  }

  const user = await getAuthUser();
  if (!user && row[0].status !== "published") {
    return errorResponse("post not found", 404);
  }

  return NextResponse.json(serializePost(row[0]));
}

export async function PUT(request: Request, { params }: { params: { postID: string } }) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(params.postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  const payload = await request.json();
  const title = (payload.title || "").trim();
  const slug = (payload.slug || "").trim();
  const markdown = (payload.markdown || "").trim();

  if (!title || !slug || !markdown) {
    return errorResponse("title, slug, and markdown are required", 400);
  }

  const updated = await getDb()
    .update(posts)
    .set({
      title,
      slug,
      summary: (payload.summary || "").trim(),
      markdown: payload.markdown,
      status: normalizeStatus(payload.status),
      publishedAt: payload.published_at || null,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(posts.id, id))
    .returning();

  if (!updated[0]) {
    return errorResponse("post not found", 404);
  }

  return NextResponse.json(serializePost(updated[0]));
}

export async function DELETE(_: Request, { params }: { params: { postID: string } }) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(params.postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  await getDb().delete(posts).where(eq(posts.id, id));
  return NextResponse.json({ status: "deleted" });
}
