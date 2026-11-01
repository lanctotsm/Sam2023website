import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { normalizeSnapshot } from "@/lib/siteTemplates/compare";
import type { SavedSiteTemplate } from "@/lib/siteTemplates/types";
import { createSiteTemplate, listSiteTemplates } from "@/services/siteTemplates";

export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 80;
const MAX_SNAPSHOT_LENGTH = 100_000;

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function toSaved(row: { id: number; name: string; snapshot: string; createdAt: string }): SavedSiteTemplate | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.snapshot);
  } catch {
    return null;
  }
  const snapshot = normalizeSnapshot(parsed);
  if (!snapshot) return null;
  return {
    id: row.id,
    name: row.name,
    snapshot,
    created_at: row.createdAt,
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return errorResponse("unauthorized", 401);

  const rows = await listSiteTemplates();
  const templates = rows.map(toSaved).filter((row): row is SavedSiteTemplate => row !== null);
  return jsonNoStore({ templates });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return errorResponse("unauthorized", 401);

  const payload = await request.json();
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    return errorResponse("name is required", 400);
  }

  const snapshot = normalizeSnapshot(payload.snapshot);
  if (!snapshot) {
    return errorResponse("snapshot must include front_page, page_styles, and nav_styles", 400);
  }
  const encoded = JSON.stringify(snapshot);
  if (encoded.length > MAX_SNAPSHOT_LENGTH) {
    return errorResponse("snapshot too large", 400);
  }

  const created = await createSiteTemplate(name, encoded);
  const saved = toSaved(created);
  if (!saved) return errorResponse("could not save template", 500);
  return jsonNoStore(saved, 201);
}
