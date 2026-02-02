import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";
import { createPost, getAllPosts } from "@/services/posts";

export async function GET(request: Request) {
  const user = await getAuthUser();
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") || undefined;

  const rows = await getAllPosts({ user, status: statusParam });
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

  try {
    const created = await createPost({
      title,
      slug,
      summary: (payload.summary || "").trim(),
      markdown,
      status: payload.status,
      publishedAt: payload.published_at || null,
      createdBy: user.id
    });
    return NextResponse.json(serializePost(created), { status: 201 });
  } catch (error) {
    return errorResponse("failed to create post", 500);
  }
}
