import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { createUser, listUsers } from "@/services/admin-users";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const rows = await listUsers();
  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name || "",
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
  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim().toLowerCase();
  if (!name) {
    return errorResponse("name is required", 400);
  }
  if (!email) {
    return errorResponse("email is required", 400);
  }

  const created = await createUser(email, name);
  if (!created) {
    return errorResponse("user already exists", 409);
  }

  return NextResponse.json(
    {
      id: created.id,
      name: created.name || "",
      email: created.email,
      is_base_admin: created.isBaseAdmin,
      created_at: created.createdAt
    },
    { status: 201 }
  );
}
