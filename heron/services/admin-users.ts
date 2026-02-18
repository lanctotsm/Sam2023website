import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

export async function listUsers() {
  return await getDb()
    .select()
    .from(adminUsers)
    .orderBy(desc(adminUsers.isBaseAdmin), asc(adminUsers.createdAt));
}

export async function getUserById(id: number) {
  const rows = await getDb().select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return rows[0] || null;
}

export async function createUser(email: string, name?: string) {
  const created = await getDb()
    .insert(adminUsers)
    .values({ email, name: (name || "").trim(), isBaseAdmin: false })
    .onConflictDoNothing()
    .returning();

  return created[0] || null;
}

export async function deleteUser(id: number) {
  await getDb().delete(adminUsers).where(eq(adminUsers.id, id));
}
