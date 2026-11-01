import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { isAllowedObjectKey } from "@/lib/object-key";
import { createImage } from "@/services/images";

type ImagePayload = {
  s3_key: string;
  width?: number | null;
  height?: number | null;
  caption?: string;
  alt_text?: string;
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const images = payload.images as ImagePayload[];

  if (!Array.isArray(images) || images.length === 0) {
    return errorResponse("images array is required", 400);
  }

  for (const img of images) {
    const s3Key = (img?.s3_key || "").trim();
    if (!s3Key) {
      return errorResponse("s3_key is required for all images", 400);
    }
    if (!isAllowedObjectKey(s3Key)) {
      return errorResponse("s3_key is not allowed", 400);
    }
  }

  try {
    const createdImages = await Promise.all(
      images.map(async (img) => {
        const s3Key = (img.s3_key || "").trim();

        return await createImage({
          s3Key,
          width: img.width ?? null,
          height: img.height ?? null,
          caption: (img.caption || "").trim(),
          altText: (img.alt_text || "").trim(),
          createdBy: user.id
        });
      })
    );

    return NextResponse.json(
      { images: createdImages.map(serializeImage) },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to create images";
    return errorResponse(message, 500);
  }
}
