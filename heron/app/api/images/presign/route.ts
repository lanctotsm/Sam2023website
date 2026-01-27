import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { presignPutObject } from "@/lib/s3";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const fileName = (payload.file_name || "").trim();
  const contentType = (payload.content_type || "").trim();
  const size = Number(payload.size || 0);

  if (!fileName || !contentType) {
    return errorResponse("file_name and content_type are required", 400);
  }

  const ext = path.extname(fileName);
  const key = `uploads/${randomUUID()}${ext}`;

  try {
    const uploadUrl = await presignPutObject({ key, contentType, size });
    const publicBaseUrl = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
    const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : key;
    return NextResponse.json({ upload_url: uploadUrl, s3_key: key, public_url: publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to presign upload";
    return errorResponse(message, 500);
  }
}
