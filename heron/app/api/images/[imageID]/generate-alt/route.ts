import { NextResponse } from "next/server";

import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { getObject } from "@/lib/s3";
import { getImageById } from "@/services/images";
import { getSetting } from "@/services/settings";
import {
  detectImageFormat,
  generateAltTextFromBytes
} from "@/lib/ai/generate-image-alt";

type Params = { params: Promise<{ imageID: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const enabled = (await getSetting("ai_alt_text_enabled")) === "true";
  if (!enabled) {
    return errorResponse("AI alt text is disabled in settings", 403);
  }

  const { imageID } = await params;
  const id = parseId(imageID);
  if (!id) {
    return errorResponse("invalid image id", 400);
  }

  const image = await getImageById(id);
  if (!image) {
    return errorResponse("image not found", 404);
  }

  const key =
    image.s3KeyLarge || image.s3Key || image.s3KeyOriginal || image.s3KeyThumb;
  if (!key) {
    return errorResponse("image has no storage key", 400);
  }

  try {
    const bytes = await getObject(key);
    const format = detectImageFormat(key);
    const alt_text = await generateAltTextFromBytes({ bytes, format });
    return NextResponse.json({ alt_text });
  } catch (err) {
    console.error("[generate-alt]", err);
    return errorResponse("Failed to generate alt text", 502);
  }
}
