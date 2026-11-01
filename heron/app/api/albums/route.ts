import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { serializeAlbum } from "@/lib/serializers";
import { createAlbum, getAllAlbums } from "@/services/albums";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { displayDateValue, optionalImageId } from "@/lib/content-fields";

export async function GET() {
  const user = await getAuthUser();
  const rows = await getAllAlbums({ includeDrafts: Boolean(user) });
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
      status: payload.status,
      displayDate: displayDateValue(payload.display_date),
      coverImageId: optionalImageId(payload.cover_image_id),
      createdBy: user.id
    });
    revalidatePublicContent();
    return NextResponse.json(serializeAlbum(created), { status: 201 });
  } catch (error) {
    return errorResponse("failed to create album", 500);
  }
}
