import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeImage } from "@/lib/serializers";
import { getAllImages } from "@/services/images";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const rows = await getAllImages();
  return NextResponse.json(rows.map(serializeImage));
}
