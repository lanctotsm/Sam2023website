/**
 * Clean up S3 objects under uploads/ that are not referenced by any image row.
 * Usage: CMS_DB_PATH=... S3_BUCKET=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... npx tsx scripts/cleanup-orphan-s3.ts
 * Optional: CLEANUP_ORPHAN_DRY_RUN=true to only list would-be orphans.
 * Optional: CLEANUP_ORPHAN_STALE_HOURS=24 to only delete objects older than 24 hours.
 */
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { listObjects, deleteObjects } from "../lib/s3";

const dbPath = process.env.CMS_DB_PATH || path.join(process.cwd(), "data", "cms.db");

function getAllImageS3KeysFromDb(): Set<string> {
  const set = new Set<string>();
  if (!fs.existsSync(dbPath)) return set;
  const db = new Database(dbPath, { readonly: true });
  const rows = db.prepare("SELECT s3_key, s3_key_thumb, s3_key_large, s3_key_original FROM images").all() as {
    s3_key: string;
    s3_key_thumb: string | null;
    s3_key_large: string | null;
    s3_key_original: string | null;
  }[];
  db.close();
  for (const row of rows) {
    for (const key of [row.s3_key, row.s3_key_thumb, row.s3_key_large, row.s3_key_original]) {
      if (key && typeof key === "string") set.add(key.replace(/^\//, "").trim());
    }
  }
  return set;
}

const UPLOADS_PREFIX = "uploads/";
const DRY_RUN = process.env.CLEANUP_ORPHAN_DRY_RUN === "true";
const STALE_HOURS = process.env.CLEANUP_ORPHAN_STALE_HOURS
  ? parseInt(process.env.CLEANUP_ORPHAN_STALE_HOURS, 10)
  : 0;

async function main() {
  const dbKeys = getAllImageS3KeysFromDb();

  const cutoff =
    STALE_HOURS > 0
      ? new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000)
      : null;

  let continuationToken: string | undefined;
  const toDelete: string[] = [];

  do {
    const result = await listObjects({
      prefix: UPLOADS_PREFIX,
      continuationToken,
      maxKeys: 1000
    });
    for (const obj of result.objects) {
      const key = obj.key.replace(/^\//, "").trim();
      if (dbKeys.has(key)) continue;
      if (cutoff && obj.lastModified && obj.lastModified > cutoff) continue;
      toDelete.push(obj.key);
    }
    continuationToken = result.nextContinuationToken;
  } while (continuationToken);

  if (toDelete.length === 0) {
    console.log("No orphan S3 objects found.");
    return;
  }

  console.log(`Found ${toDelete.length} orphan object(s).`);
  if (DRY_RUN) {
    toDelete.slice(0, 50).forEach((k) => console.log("  ", k));
    if (toDelete.length > 50) console.log("  ... and", toDelete.length - 50, "more");
    console.log("Dry run: no objects deleted.");
    return;
  }

  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 1000) {
    const batch = toDelete.slice(i, i + 1000);
    await deleteObjects(batch);
    deleted += batch.length;
  }
  console.log(`Deleted ${deleted} orphan object(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
