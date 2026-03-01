import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";
import { deletePost, getPostById, updatePost } from "@/services/posts";
import {
  getPostInlineImageIds,
  isImageReferencedByAnyPost,
  replacePostInlineImages
} from "@/services/postInlineImages";
import { isImageLinkedToAnyAlbum } from "@/services/albumImages";
import { deleteImage, getImageById } from "@/services/images";
import { deleteObjects } from "@/lib/s3";

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

  const inlineImageIds = user ? await getPostInlineImageIds(id) : undefined;
  return NextResponse.json(serializePost(row, { inlineImageIds }));
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

  const inlineImageIdsRaw = payload.inline_image_ids;
  const inlineImageIds =
    Array.isArray(inlineImageIdsRaw)
      ? inlineImageIdsRaw.map((x: unknown) => Number(x)).filter((x: number) => Number.isInteger(x) && x > 0)
      : undefined;

  if (!title || !slug || !markdown) {
    return errorResponse("title, slug, and markdown are required", 400);
  }

  const updated = await updatePost(id, {
    title,
    slug,
    summary: (payload.summary || "").trim(),
    markdown,
    status: payload.status,
    publishedAt: payload.published_at || null,
    metadata: payload.metadata || null
  });

  if (!updated) {
    return errorResponse("post not found", 404);
  }

  if (inlineImageIds) {
    await replacePostInlineImages(id, inlineImageIds);
  }
  const persistedInlineImageIds = await getPostInlineImageIds(id);
  return NextResponse.json(serializePost(updated, { inlineImageIds: persistedInlineImageIds }));
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

  const ownedImageIds = await getPostInlineImageIds(id);
  await deletePost(id);

  for (const imageId of ownedImageIds) {
    const stillUsedByPosts = await isImageReferencedByAnyPost(imageId);
    if (stillUsedByPosts) continue;

    const linkedToAlbum = await isImageLinkedToAnyAlbum(imageId);
    if (linkedToAlbum) continue;

    const row = await getImageById(imageId);
    if (!row) continue;

    const keys: string[] = [];
    for (const key of [row.s3Key, row.s3KeyThumb, row.s3KeyLarge, row.s3KeyOriginal]) {
      if (key && typeof key === "string") {
        keys.push(key.replace(/^\//, ""));
      }
    }
    if (keys.length > 0) {
      await deleteObjects(keys);
    }
    await deleteImage(imageId);
  }
  return NextResponse.json({ status: "deleted" });
}
