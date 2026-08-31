import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

function isBaseAdminEmail(email: string) {
  const baseAdmin = normalizeEmail(process.env.BASE_ADMIN_EMAIL);
  return Boolean(baseAdmin && baseAdmin === email);
}

async function findInvitedAdmin(email: string) {
  const db = getDb();
  const [allowed] = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  return allowed || null;
}

export async function getAllowedAdminUser(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  if (isBaseAdminEmail(normalized)) {
    const db = getDb();
    await db
      .insert(adminUsers)
      .values({ email: normalized, isBaseAdmin: true, name: "Base Admin" })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: { isBaseAdmin: true }
      });
    return { name: "Base Admin" };
  }

  return findInvitedAdmin(normalized);
}

export async function isAllowedUserEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }
  if (isBaseAdminEmail(normalized)) {
    return true;
  }
  return Boolean(await findInvitedAdmin(normalized));
}

export async function jwtIfStillAllowed<T extends { email?: unknown }>(
  token: T,
  isAllowed: (email: string) => Promise<boolean> = isAllowedUserEmail
): Promise<T | Record<string, never>> {
  const email = normalizeEmail(typeof token.email === "string" ? token.email : "");
  if (!email || !(await isAllowed(email))) {
    return {};
  }
  return { ...token, email };
}

export function sessionUserFromToken(token: {
  email?: unknown;
  userId?: unknown;
  role?: unknown;
  name?: unknown;
}) {
  const email = typeof token.email === "string" ? token.email : "";
  const userId = typeof token.userId === "number" ? token.userId : undefined;
  if (!email || userId == null) {
    return null;
  }
  return {
    id: userId,
    email,
    role: typeof token.role === "string" ? token.role : "admin",
    name: typeof token.name === "string" ? token.name : undefined
  };
}
