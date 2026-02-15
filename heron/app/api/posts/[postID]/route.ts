import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";
import { deletePost, getPostById, updatePost } from "@/services/posts";

export async function GET(_: Request, { params }: { params: Promise<{ postID: string }> }) {
  const { postID } = await params;
  const id = parseId(postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  const row = await getPostById(id);
  if (!row) {
    return errorResponse("post not found", 404);
  }

  const user = await getAuthUser();
  if (!user && row.status !== "published") {
    return errorResponse("post not found", 404);
  }

  return NextResponse.json(serializePost(row));
}

export async function PUT(request: Request, { params }: { params: Promise<{ postID: string }> }) {
  const { postID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(postID);
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

  const updated = await updatePost(id, {
    title,
    slug,
    summary: (payload.summary || "").trim(),
    markdown,
    status: payload.status,
    publishedAt: payload.published_at || null
  });

  if (!updated) {
    return errorResponse("post not found", 404);
  }

  return NextResponse.json(serializePost(updated));
}

export async function DELETE(_: Request, { params }: { params: Promise<{ postID: string }> }) {
  const { postID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(postID);
  if (!id) {
    return errorResponse("invalid post id", 400);
  }

  await deletePost(id);
  return NextResponse.json({ status: "deleted" });
}
