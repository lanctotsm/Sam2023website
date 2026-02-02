import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { allowedEmails } from "@/lib/db/schema";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";

export async function DELETE(_: Request, { params }: { params: Promise<{ userID: string }> }) {
  const { userID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(userID);
  if (!id) {
    return errorResponse("invalid user id", 400);
  }

  const row = await getDb().select().from(allowedEmails).where(eq(allowedEmails.id, id)).limit(1);
  if (!row[0]) {
    return errorResponse("admin user not found", 404);
  }

  if (row[0].isBaseAdmin) {
    return errorResponse("cannot remove base admin user", 403);
  }

  await getDb().delete(allowedEmails).where(eq(allowedEmails.id, id));
  return NextResponse.json({ status: "removed" });
}
