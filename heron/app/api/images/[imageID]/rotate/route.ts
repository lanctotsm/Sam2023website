import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { getImageById, updateImage } from "@/services/images";
import { deleteObjects, getObject, putObject } from "@/lib/s3";
import { processImage, rotateImage } from "@/lib/image-processing";

const ROTATIONS = [90, 180, 270] as const;
type Rotation = (typeof ROTATIONS)[number];

function isRotation(n: number): n is Rotation {
  return ROTATIONS.includes(n as Rotation);
}

export async function PATCH(
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

  let body: { rotate?: number };
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid JSON", 400);
  }
  const rotate = Number(body.rotate);
  if (!Number.isInteger(rotate) || !isRotation(rotate)) {
    return errorResponse("rotate must be 90, 180, or 270", 400);
  }

  const originalKey = row.s3KeyOriginal ?? row.s3Key;
  if (!originalKey) {
    return errorResponse("no original image to rotate", 400);
  }

  const key = originalKey.replace(/^\//, "");

  try {
    const buffer = await getObject(key);
    const rotated = await rotateImage(buffer, rotate as Rotation);
    const processed = await processImage(rotated);

    const uuid = randomUUID();
    const ext = path.extname(originalKey) || ".jpg";
    const keyThumb = `uploads/${uuid}/thumb.jpg`;
    const keyLarge = `uploads/${uuid}/large.jpg`;
    const keyOriginal = `uploads/${uuid}/original${ext}`;

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

    const oldKeys: string[] = [];
    for (const k of [row.s3Key, row.s3KeyThumb, row.s3KeyLarge, row.s3KeyOriginal]) {
      if (k && typeof k === "string") {
        oldKeys.push(k.replace(/^\//, ""));
      }
    }

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
    const message = err instanceof Error ? err.message : "rotate failed";
    return errorResponse(message, 500);
  }
}
