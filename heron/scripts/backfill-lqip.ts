/**
 * Generates the blur-up placeholder for images uploaded before the lqip column
 * existed. Safe to re-run: it only touches rows where lqip is still null.
 *
 *   npx tsx scripts/backfill-lqip.ts [--dry-run] [--limit=50]
 */

import { eq, isNull } from "drizzle-orm";
import { getDb } from "../lib/db";
import { images } from "../lib/db/schema";
import { generateLqip } from "../lib/image-processing";
import { getObject } from "../lib/s3";

type Args = { dryRun: boolean; limit: number | null };

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  const parsed = limitArg ? Number(limitArg.split("=")[1]) : Number.NaN;
  return {
    dryRun,
    limit: Number.isFinite(parsed) && parsed > 0 ? parsed : null
  };
}

async function main() {
  const { dryRun, limit } = parseArgs(process.argv.slice(2));
  const db = getDb();

  const rows = await db
    .select({
      id: images.id,
      s3Key: images.s3Key,
      s3KeyThumb: images.s3KeyThumb
    })
    .from(images)
    .where(isNull(images.lqip));

  const targets = limit ? rows.slice(0, limit) : rows;

  if (targets.length === 0) {
    console.log("No images need an lqip. Nothing to do.");
    return;
  }

  console.log(
    `${targets.length} image(s) missing an lqip${dryRun ? " (dry run, no writes)" : ""}.`
  );

  let updated = 0;
  const failures: { id: number; reason: string }[] = [];

  for (const row of targets) {
    // The thumb is far cheaper to fetch and produces an identical placeholder.
    const key = row.s3KeyThumb ?? row.s3Key;
    try {
      const buffer = await getObject(key);
      const lqip = await generateLqip(buffer);

      if (!dryRun) {
        await db.update(images).set({ lqip }).where(eq(images.id, row.id));
      }
      updated++;
      console.log(`  image ${row.id}: ${lqip.length} bytes`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ id: row.id, reason });
      console.warn(`  image ${row.id}: FAILED (${reason})`);
    }
  }

  console.log(`\nDone. ${updated} succeeded, ${failures.length} failed.`);
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
