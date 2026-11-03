import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { isPubliclyVisible } from "@/lib/posts-visibility";
import { serializePost } from "@/lib/serializers";
import { deletePost, getPostById, updatePost } from "@/services/posts";
import {
  getPostInlineImageIds,
  isImageReferencedByAnyPost
} from "@/services/postInlineImages";
import { isImageLinkedToAnyAlbum } from "@/services/albumImages";
import { deleteImage, getImageById } from "@/services/images";
import { deleteObjects } from "@/lib/s3";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { postSaveError, readPostInput } from "@/lib/post-input";

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
  if (!user && !isPubliclyVisible(row)) {
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

  const input = await readPostInput(request);
  if (!input.ok) return errorResponse(input.error, 400);

  try {
    const updated = await updatePost(id, input.data);
    if (!updated) return errorResponse("post not found", 404);

    revalidatePublicContent();
    const inlineImageIds = await getPostInlineImageIds(id);
    return NextResponse.json(serializePost(updated, { inlineImageIds }));
  } catch (error) {
    const failure = postSaveError(error);
    return errorResponse(failure.message, failure.status);
  }
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
  revalidatePublicContent();

  try {
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
  } catch (err) {
    console.error("Failed to clean up images for deleted post:", err);
  }
  return NextResponse.json({ status: "deleted" });
}
