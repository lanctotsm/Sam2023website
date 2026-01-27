import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { allowedEmails } from "@/lib/db/schema";
import { errorResponse, getAuthUser } from "@/lib/api-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const rows = await getDb()
    .select()
    .from(allowedEmails)
    .orderBy(desc(allowedEmails.isBaseAdmin), asc(allowedEmails.createdAt));

  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      email: row.email,
      is_base_admin: row.isBaseAdmin,
      created_at: row.createdAt
    }))
  );
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const payload = await request.json();
  const email = (payload.email || "").trim().toLowerCase();
  if (!email) {
    return errorResponse("email is required", 400);
  }

  const created = await getDb()
    .insert(allowedEmails)
    .values({ email, isBaseAdmin: false })
    .onConflictDoNothing()
    .returning();

  if (!created[0]) {
    return errorResponse("admin user already exists", 409);
  }

  return NextResponse.json(
    {
      id: created[0].id,
      email: created[0].email,
      is_base_admin: created[0].isBaseAdmin,
      created_at: created[0].createdAt
    },
    { status: 201 }
  );
}
