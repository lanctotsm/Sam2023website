import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { createImage } from "@/services/images";
import { addAlbumImage } from "@/services/albumImages";
import { putObject, deleteObjects } from "@/lib/s3";
import { processImage } from "@/lib/image-processing";

const MAX_FILE_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = /^image\/(jpeg|jpg|png|gif|webp|bmp)$/i;

async function rollback(uploadedKeys: string[], createdImageIds: number[]) {
  const { deleteImage } = await import("@/services/images");
  for (const id of createdImageIds) {
    try {
      await deleteImage(id);
    } catch {
      // best effort
    }
  }
  if (uploadedKeys.length > 0) {
    try {
      await deleteObjects(uploadedKeys);
    } catch {
      // best effort
    }
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  // Validate Content-Length before parsing FormData to avoid loading oversized requests into memory
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const requestSize = parseInt(contentLength, 10);
    // Allow some overhead for multipart boundaries and headers (10% buffer)
    const maxRequestSize = MAX_FILE_BYTES * 1.1;
    if (requestSize > maxRequestSize) {
      const maxMB = Math.round(MAX_FILE_BYTES / (1024 * 1024));
      return errorResponse(`request size exceeds ${maxMB}MB limit`, 413);
    }
  }

  const uploadedKeys: string[] = [];
  const createdImageIds: number[] = [];

  try {
    const formData = await request.formData();
    const albumIdRaw = formData.get("album_id");
    const albumId = albumIdRaw != null ? parseInt(String(albumIdRaw), 10) : null;
    const caption = (formData.get("caption") as string)?.trim() ?? "";
    const altText = (formData.get("alt_text") as string)?.trim() ?? "";

    const files: File[] = [];
    const fileList = formData.getAll("files");
    for (const entry of fileList) {
      if (entry instanceof File && entry.size > 0) {
        files.push(entry);
      }
    }
    if (files.length === 0) {
      return errorResponse("at least one file is required", 400);
    }

    const createdImages: Awaited<ReturnType<typeof createImage>>[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (file.size > MAX_FILE_BYTES) {
        await rollback(uploadedKeys, createdImageIds);
        return errorResponse(`file ${file.name} exceeds max size`, 400);
      }
      const contentType = file.type || "image/jpeg";
      if (!ALLOWED_TYPES.test(contentType)) {
        await rollback(uploadedKeys, createdImageIds);
        return errorResponse(`file ${file.name}: unsupported type`, 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const processed = await processImage(buffer);

      const uuid = randomUUID();
      const ext = path.extname(file.name) || ".jpg";
      const keyThumb = `uploads/${uuid}/thumb.jpg`;
      const keyLarge = `uploads/${uuid}/large.jpg`;
      const keyOriginal = `uploads/${uuid}/original${ext}`;

      await putObject({
        key: keyThumb,
        body: processed.thumb.buffer,
        contentType: "image/jpeg"
      });
      uploadedKeys.push(keyThumb);
      await putObject({
        key: keyLarge,
        body: processed.large.buffer,
        contentType: "image/jpeg"
      });
      uploadedKeys.push(keyLarge);
      await putObject({
        key: keyOriginal,
        body: processed.original.buffer,
        contentType: processed.original.contentType
      });
      uploadedKeys.push(keyOriginal);

      const row = await createImage({
        s3Key: keyLarge,
        s3KeyThumb: keyThumb,
        s3KeyLarge: keyLarge,
        s3KeyOriginal: keyOriginal,
        width: processed.large.width,
        height: processed.large.height,
        caption,
        altText,
        createdBy: user.id
      });
      createdImages.push(row);
      createdImageIds.push(row.id);

      if (albumId != null && Number.isInteger(albumId) && albumId > 0) {
        await addAlbumImage(albumId, row.id, index);
      }
    }

    return NextResponse.json(
      { images: createdImages.map(serializeImage) },
      { status: 201 }
    );
  } catch (err) {
    await rollback(uploadedKeys, createdImageIds);
    const message = err instanceof Error ? err.message : "upload failed";
    return errorResponse(message, 500);
  }
}
