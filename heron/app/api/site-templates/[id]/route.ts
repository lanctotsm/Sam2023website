import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { deleteSiteTemplate } from "@/services/siteTemplates";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return errorResponse("unauthorized", 401);

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return errorResponse("invalid template id", 400);

  const removed = await deleteSiteTemplate(id);
  if (!removed) return errorResponse("template not found", 404);
  return NextResponse.json({ ok: true });
}
