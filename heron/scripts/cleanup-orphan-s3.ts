/**
 * Preview unreferenced S3 uploads (dry-run default): npm run cleanup:orphan-s3
 * Delete reviewed candidates: npm run cleanup:orphan-s3 -- --apply
 * Requires CMS_DB_PATH and the matching S3 configuration in the environment.
 * CLEANUP_ORPHAN_STALE_HOURS defaults to 24; smaller values are rejected.
 */
import { cleanupOptions, cleanupOrphanObjects } from "../lib/orphan-s3-cleanup";
import { listObjects, deleteObjects } from "../lib/s3";

async function main() {
  const options = cleanupOptions(process.argv.slice(2), process.env);
  if (!process.env.S3_BUCKET?.trim()) throw new Error("S3_BUCKET is required.");
  console.log(`Inspecting database ${options.dbPath} against bucket ${process.env.S3_BUCKET}`);
  await cleanupOrphanObjects(options, { listObjects, deleteObjects });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
