import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { getImageById } from "@/services/images";
import { getObject } from "@/lib/s3";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp"
};

function getContentType(key: string): string {
  const ext = key.toLowerCase().slice(key.lastIndexOf("."));
  return CONTENT_TYPES[ext] ?? "image/jpeg";
}

/** Proxies image from S3 for same-origin loading (avoids CORS for crop/canvas). */
export async function GET(_: Request, { params }: { params: Promise<{ imageID: string }> }) {
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

  const key = (row.s3KeyOriginal ?? row.s3KeyLarge ?? row.s3Key)?.replace(/^\//, "");
  if (!key) {
    return errorResponse("no image data", 404);
  }

  try {
    const buffer = await getObject(key);
    const contentType = getContentType(key);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60"
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "failed to load image";
    return errorResponse(msg, 500);
  }
}
