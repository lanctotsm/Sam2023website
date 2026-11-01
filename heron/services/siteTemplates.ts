import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { siteTemplates } from "@/lib/db/schema";

export async function listSiteTemplates() {
  return getDb()
    .select()
    .from(siteTemplates)
    .orderBy(desc(siteTemplates.createdAt), desc(siteTemplates.id));
}

export async function createSiteTemplate(name: string, snapshot: string) {
  const rows = await getDb().insert(siteTemplates).values({ name, snapshot }).returning();
  return rows[0];
}

export async function deleteSiteTemplate(id: number) {
  const existing = await getDb().select().from(siteTemplates).where(eq(siteTemplates.id, id)).limit(1);
  if (!existing[0]) return null;
  await getDb().delete(siteTemplates).where(eq(siteTemplates.id, id));
  return existing[0];
}
