import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";
import { createAlbum, getAllAlbums } from "@/services/albums";

export async function GET() {
  const rows = await getAllAlbums();
  return NextResponse.json(rows.map(serializeAlbum));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const title = (payload.title || "").trim();
  const slug = (payload.slug || "").trim();

  if (!title || !slug) {
    return errorResponse("title and slug are required", 400);
  }

  try {
    const created = await createAlbum({
      title,
      slug,
      description: (payload.description || "").trim(),
      createdBy: user.id
    });
    return NextResponse.json(serializeAlbum(created), { status: 201 });
  } catch (error) {
    return errorResponse("failed to create album", 500);
  }
}
