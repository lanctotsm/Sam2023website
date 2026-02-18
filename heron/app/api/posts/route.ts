import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";
import { createPost, getAllPosts } from "@/services/posts";
import { replacePostInlineImages } from "@/services/postInlineImages";

export async function GET(request: Request) {
  const user = await getAuthUser();
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") || undefined;

  const rows = await getAllPosts({ user, status: statusParam });
  return NextResponse.json(rows.map((row) => serializePost(row)));
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

  const inlineImageIdsRaw = payload.inline_image_ids;
  const inlineImageIds =
    Array.isArray(inlineImageIdsRaw)
      ? inlineImageIdsRaw.map((x: unknown) => Number(x)).filter((x: number) => Number.isInteger(x) && x > 0)
      : undefined;

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
    if (inlineImageIds) {
      await replacePostInlineImages(created.id, inlineImageIds);
    }
    return NextResponse.json(
      serializePost(created, inlineImageIds ? { inlineImageIds } : undefined),
      { status: 201 }
    );
  } catch (error) {
    return errorResponse("failed to create post", 500);
  }
}
