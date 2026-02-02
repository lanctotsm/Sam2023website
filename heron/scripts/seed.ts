import { getDb } from "../lib/db";
import { albums, adminUsers } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting local seed...");
  const db = getDb();

  // 1. Seed Base User
  const baseAdminEmail = (process.env.BASE_ADMIN_EMAIL || "dev@local").trim().toLowerCase();
  if (baseAdminEmail) {
    console.log(`Seeding base user: ${baseAdminEmail}`);
    await db
      .insert(adminUsers)
      .values({
        email: baseAdminEmail,
        isBaseAdmin: true,
      })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: { isBaseAdmin: true },
      });
  }

  // 2. Seed Sample Album
  const existingAlbums = await db.select().from(albums).limit(1);
  if (existingAlbums.length === 0) {
    console.log("Seeding sample album...");
    await db.insert(albums).values({
      title: "Sample Album",
      slug: "sample-album",
      description: "Starter album for local testing.",
    });
  }

  console.log("Local seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
