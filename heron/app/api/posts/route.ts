import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { errorResponse, getAuthUser, normalizeStatus } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";

export async function GET(request: Request) {
  const user = await getAuthUser();
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const db = getDb();
  const query = user
    ? statusParam
      ? db.select().from(posts).where(eq(posts.status, statusParam)).orderBy(desc(posts.createdAt))
      : db.select().from(posts).orderBy(desc(posts.createdAt))
    : db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.createdAt));

  const rows = await query;
  return NextResponse.json(rows.map(serializePost));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const title = (payload.title || "").trim();
  const slug = (payload.slug || "").trim();
  const markdown = (payload.markdown || "").trim();

  if (!title || !slug || !markdown) {
    return errorResponse("title, slug, and markdown are required", 400);
  }

  const created = await getDb()
    .insert(posts)
    .values({
      title,
      slug,
      summary: (payload.summary || "").trim(),
      markdown: payload.markdown,
      status: normalizeStatus(payload.status),
      publishedAt: payload.published_at || null,
      createdBy: user.id
    })
    .returning();

  return NextResponse.json(serializePost(created[0]), { status: 201 });
}
