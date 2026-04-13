import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { putObject } from "@/lib/s3";
import { buildImageUrl } from "@/lib/images";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB for background images
const ALLOWED_TYPES = /^image\/(jpeg|jpg|png|webp|gif)$/i;

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  // Validate Content-Length before parsing
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_FILE_BYTES * 1.1) {
    return errorResponse("request too large", 413);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return errorResponse("file is required", 400);
    }

    if (file.size > MAX_FILE_BYTES) {
      return errorResponse("file exceeds max size", 400);
    }

    const contentType = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.test(contentType)) {
      return errorResponse("unsupported file type", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image with sharp (max 1920px, jpeg format)
    const processedBuffer = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const uuid = randomUUID();
    const s3Key = `backgrounds/${uuid}.jpg`;

    // Upload to S3
    await putObject({
      key: s3Key,
      body: processedBuffer,
      contentType: "image/jpeg"
    });

    const publicUrl = buildImageUrl(s3Key);

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload failed";
    return errorResponse(message, 500);
  }
}
