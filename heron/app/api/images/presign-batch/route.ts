import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { presignPutObject } from "@/lib/s3";

type PresignRequest = {
  file_name: string;
  content_type: string;
  size: number;
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const files = payload.files as PresignRequest[];

  if (!Array.isArray(files) || files.length === 0) {
    return errorResponse("files array is required", 400);
  }

  try {
    const publicBaseUrl = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
    
    const presignedFiles = await Promise.all(
      files.map(async (file) => {
        const fileName = (file.file_name || "").trim();
        const contentType = (file.content_type || "").trim();
        const size = Number(file.size || 0);

        if (!fileName || !contentType) {
          throw new Error(`Invalid file: ${fileName}`);
        }

        const ext = path.extname(fileName);
        const key = `uploads/${randomUUID()}${ext}`;
        const uploadUrl = await presignPutObject({ key, contentType, size });
        const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : key;

        return {
          file_name: fileName,
          upload_url: uploadUrl,
          s3_key: key,
          public_url: publicUrl
        };
      })
    );

    return NextResponse.json({ files: presignedFiles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to presign uploads";
    return errorResponse(message, 500);
  }
}
