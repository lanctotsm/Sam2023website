import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { deleteImage, getImageById, updateImage } from "@/services/images";
import { deleteObjects, putObject } from "@/lib/s3";
import { processImage } from "@/lib/image-processing";

const MAX_FILE_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 100 * 1024 * 1024;
const ALLOWED_TYPES = /^image\/(jpeg|jpg|png|gif|webp|bmp)$/i;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ imageID: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const { imageID } = await params;
  const id = parseId(imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  const row = await getImageById(id);
  if (!row) {
    return errorResponse("image not found", 404);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
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
  const processed = await processImage(buffer);

  const uuid = randomUUID();
  const ext = path.extname(file.name) || ".jpg";
  const keyThumb = `uploads/${uuid}/thumb.jpg`;
  const keyLarge = `uploads/${uuid}/large.jpg`;
  const keyOriginal = `uploads/${uuid}/original${ext}`;

  const oldKeys: string[] = [];
  for (const key of [row.s3Key, row.s3KeyThumb, row.s3KeyLarge, row.s3KeyOriginal]) {
    if (key && typeof key === "string") {
      oldKeys.push(key.replace(/^\//, ""));
    }
  }

  try {
    await putObject({
      key: keyThumb,
      body: processed.thumb.buffer,
      contentType: "image/jpeg"
    });
    await putObject({
      key: keyLarge,
      body: processed.large.buffer,
      contentType: "image/jpeg"
    });
    await putObject({
      key: keyOriginal,
      body: processed.original.buffer,
      contentType: processed.original.contentType
    });

    const updated = await updateImage(id, {
      s3Key: keyLarge,
      s3KeyThumb: keyThumb,
      s3KeyLarge: keyLarge,
      s3KeyOriginal: keyOriginal,
      width: processed.large.width,
      height: processed.large.height
    });

    if (oldKeys.length > 0) {
      await deleteObjects(oldKeys);
    }

    return NextResponse.json(serializeImage(updated!));
  } catch (err) {
    const newKeys = [keyThumb, keyLarge, keyOriginal];
    try {
      await deleteObjects(newKeys);
    } catch {
      // best effort
    }
    const message = err instanceof Error ? err.message : "replace failed";
    return errorResponse(message, 500);
  }
}
