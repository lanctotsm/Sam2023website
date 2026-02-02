import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { createImage, getAllImages } from "@/services/images";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const rows = await getAllImages();
  return NextResponse.json(rows.map(serializeImage));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const s3Key = (payload.s3_key || "").trim();
  if (!s3Key) {
    return errorResponse("s3_key is required", 400);
  }

  try {
    const created = await createImage({
      s3Key,
      width: payload.width ?? null,
      height: payload.height ?? null,
      caption: (payload.caption || "").trim(),
      altText: (payload.alt_text || "").trim(),
      createdBy: user.id
    });
    return NextResponse.json(serializeImage(created), { status: 201 });
  } catch (error) {
    return errorResponse("failed to create image", 500);
  }
}
