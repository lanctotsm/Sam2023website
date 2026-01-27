import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export type AuthUser = {
  id: number;
  email: string;
  role: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role || "admin"
  };
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function normalizeStatus(status?: string | null) {
  switch ((status || "").trim().toLowerCase()) {
    case "published":
      return "published";
    case "archived":
      return "archived";
    default:
      return "draft";
  }
}

export function parseId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
