import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializePost } from "@/lib/serializers";
import { createPost, getAllPosts } from "@/services/posts";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { postSaveError, readPostInput } from "@/lib/post-input";

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

  const input = await readPostInput(request);
  if (!input.ok) return errorResponse(input.error, 400);

  try {
    const created = await createPost({
      ...input.data,
      createdBy: user.id
    });
    revalidatePublicContent();
    return NextResponse.json(
      serializePost(created, { inlineImageIds: input.data.inlineImageIds }),
      { status: 201 }
    );
  } catch (error) {
    const failure = postSaveError(error);
    return errorResponse(failure.message, failure.status);
  }
}
