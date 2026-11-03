import fs from "node:fs";
import Database from "better-sqlite3";
import type { listObjects, deleteObjects } from "./s3";

const UPLOADS_PREFIX = "uploads/";
const MINIMUM_AGE_HOURS = 24;

export type CleanupOptions = {
  dbPath: string;
  apply: boolean;
  minimumAgeHours: number;
};

type Storage = {
  listObjects: typeof listObjects;
  deleteObjects: typeof deleteObjects;
};

/** Deletion requires an explicit CLI flag; legacy dry-run=false never opts in. */
export function cleanupOptions(args: string[], env: NodeJS.ProcessEnv): CleanupOptions {
  if (args.some((arg) => arg !== "--apply") || args.length > 1) {
    throw new Error("Usage: npm run cleanup:orphan-s3 [-- --apply]");
  }
  const dbPath = env.CMS_DB_PATH?.trim();
  if (!dbPath) throw new Error("CMS_DB_PATH must explicitly identify the database to inspect.");

  const age = env.CLEANUP_ORPHAN_STALE_HOURS ?? String(MINIMUM_AGE_HOURS);
  const minimumAgeHours = Number(age);
  if (!/^\d+$/.test(age) || !Number.isSafeInteger(minimumAgeHours) || minimumAgeHours < MINIMUM_AGE_HOURS) {
    throw new Error(`CLEANUP_ORPHAN_STALE_HOURS must be an integer of at least ${MINIMUM_AGE_HOURS}.`);
  }
  if (env.CLEANUP_ORPHAN_DRY_RUN !== undefined && !["true", "false"].includes(env.CLEANUP_ORPHAN_DRY_RUN)) {
    throw new Error("CLEANUP_ORPHAN_DRY_RUN must be true or false when set.");
  }
  if (args.includes("--apply") && env.CLEANUP_ORPHAN_DRY_RUN === "true") {
    throw new Error("Remove CLEANUP_ORPHAN_DRY_RUN=true before using --apply.");
  }
  return { dbPath, apply: args.includes("--apply"), minimumAgeHours };
}

/** Never create a database, run migrations, or interpret a missing DB as empty. */
function imageKeys(dbPath: string): Set<string> {
  if (!fs.existsSync(dbPath)) throw new Error(`Database not found: ${dbPath}`);
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const rows = db.prepare("SELECT s3_key, s3_key_thumb, s3_key_large, s3_key_original FROM images").all() as Record<string, unknown>[];
    const keys = new Set<string>();
    for (const row of rows) {
      for (const value of Object.values(row)) {
        if (typeof value === "string" && value.trim()) keys.add(value.replace(/^\//, "").trim());
      }
    }
    if (keys.size === 0) {
      throw new Error("Database has no image references. Refusing cleanup; verify the database and bucket before any manual recovery.");
    }
    return keys;
  } finally {
    db.close();
  }
}

export async function cleanupOrphanObjects(
  options: CleanupOptions,
  storage: Storage,
  log: (message: string) => void = console.log
): Promise<void> {
  // Validate the DB before any storage calls, including dry runs.
  const referenced = imageKeys(options.dbPath);
  const cutoff = Date.now() - options.minimumAgeHours * 60 * 60 * 1000;
  if (!Number.isFinite(cutoff) || options.minimumAgeHours < MINIMUM_AGE_HOURS) {
    throw new Error(`Minimum object age must be at least ${MINIMUM_AGE_HOURS} hours.`);
  }
  const candidates: string[] = [];
  let continuationToken: string | undefined;
  do {
    const result = await storage.listObjects({ prefix: UPLOADS_PREFIX, continuationToken, maxKeys: 1000 });
    for (const object of result.objects) {
      const modified = object.lastModified?.getTime();
      // Unknown timestamps cannot establish that an upload has finished.
      if (!object.key.startsWith(UPLOADS_PREFIX) || referenced.has(object.key)) continue;
      if (modified === undefined || !Number.isFinite(modified) || modified > cutoff) continue;
      candidates.push(object.key);
    }
    continuationToken = result.nextContinuationToken;
  } while (continuationToken);

  log(`Found ${candidates.length} unreferenced object(s) at least ${options.minimumAgeHours} hours old.`);
  if (!options.apply) {
    candidates.slice(0, 50).forEach((key) => log(`  ${key}`));
    if (candidates.length > 50) log(`  ... and ${candidates.length - 50} more`);
    log("Dry run: no objects deleted. Review the database, bucket, and candidates before rerunning with --apply.");
    return;
  }

  let deleted = 0;
  for (let index = 0; index < candidates.length; index += 1000) {
    // Listing can take time. Preserve references added since the initial read,
    // and stop if the database has disappeared or become empty in the meantime.
    const currentReferences = imageKeys(options.dbPath);
    const batch = candidates.slice(index, index + 1000).filter((key) => !currentReferences.has(key));
    if (batch.length === 0) continue;
    await storage.deleteObjects(batch);
    deleted += batch.length;
  }
  log(`Deleted ${deleted} orphan object(s).`);
}
