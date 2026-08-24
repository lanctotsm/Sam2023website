import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

export async function getAllowedAdminUser(email: string) {
  const baseAdmin = normalizeEmail(process.env.BASE_ADMIN_EMAIL);
  if (baseAdmin && baseAdmin === email) {
    const db = getDb();
    await db
      .insert(adminUsers)
      .values({ email, isBaseAdmin: true, name: "Base Admin" })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: { isBaseAdmin: true }
      });
    return { name: "Base Admin" };
  }

  const db = getDb();
  const [allowed] = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  return allowed || null;
}

export async function isAllowedUserEmail(email: string) {
  const allowed = await getAllowedAdminUser(email);
  return Boolean(allowed);
}

export async function jwtIfStillAllowed<T extends { email?: unknown }>(
  token: T,
  isAllowed: (email: string) => Promise<boolean> = isAllowedUserEmail
): Promise<T | Record<string, never>> {
  const email = normalizeEmail(typeof token.email === "string" ? token.email : "");
  if (!email || !(await isAllowed(email))) {
    return {};
  }
  return token;
}
