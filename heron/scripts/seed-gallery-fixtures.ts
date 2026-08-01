/**
 * Local-only fixture generator for exercising the justified gallery.
 *
 * Writes synthetic photos of mixed aspect ratios to a directory that can be
 * served as the S3 origin, then inserts matching image rows (with lqip) and
 * links them to an album.
 *
 *   npx tsx scripts/seed-gallery-fixtures.ts ./tmp/s3
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { getDb } from "../lib/db";
import { albumImages, albums, images } from "../lib/db/schema";
import { generateLqip } from "../lib/image-processing";

const ALBUM_SLUG = "sample-album";

// Mixed orientations so row packing has something interesting to solve.
const FIXTURES: { w: number; h: number; hue: number; caption: string }[] = [
  { w: 3000, h: 2000, hue: 18, caption: "Golden hour over the ridge" },
  { w: 2000, h: 3000, hue: 40, caption: "Standing stones" },
  { w: 2400, h: 2400, hue: 200, caption: "Still water" },
  { w: 4000, h: 1400, hue: 8, caption: "Wide valley panorama" },
  { w: 2800, h: 1900, hue: 95, caption: "Fern understory" },
  { w: 1800, h: 2600, hue: 320, caption: "Doorway in the old town" },
  { w: 3200, h: 2100, hue: 55, caption: "Wheat before the storm" },
  { w: 2000, h: 2600, hue: 260, caption: "Dusk, looking up" },
  { w: 3600, h: 2400, hue: 150, caption: "The long shoreline" },
  { w: 2200, h: 2200, hue: 0, caption: "Red door" },
  { w: 3000, h: 1250, hue: 220, caption: "Bridge span" },
  { w: 1900, h: 2850, hue: 30, caption: "Cathedral of trees" },
  { w: 2600, h: 1750, hue: 175, caption: "Morning fog burning off" },
  { w: 2400, h: 3200, hue: 285, caption: "Stairwell" }
];

/** A soft two-tone gradient reads much more like a photo than a flat fill. */
async function makePhoto(width: number, height: number, hue: number): Promise<Buffer> {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue}, 62%, 68%)" />
          <stop offset="55%" stop-color="hsl(${(hue + 24) % 360}, 48%, 42%)" />
          <stop offset="100%" stop-color="hsl(${(hue + 60) % 360}, 40%, 22%)" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
      <circle cx="${width * 0.72}" cy="${height * 0.28}" r="${Math.min(width, height) * 0.16}"
              fill="hsl(${(hue + 180) % 360}, 70%, 82%)" opacity="0.55" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia, serif" font-size="${Math.round(Math.min(width, height) * 0.16)}"
            fill="rgba(255,255,255,0.82)">${width}x${height}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}

async function main() {
  const outRoot = path.resolve(process.argv[2] || "./tmp/s3");
  const db = getDb();

  const albumRows = await db.select().from(albums).where(eq(albums.slug, ALBUM_SLUG)).limit(1);
  const album = albumRows[0];
  if (!album) throw new Error(`Album "${ALBUM_SLUG}" not found. Run the seed script first.`);

  // Start clean so re-runs do not pile up duplicates.
  await db.delete(albumImages).where(eq(albumImages.albumId, album.id));

  await mkdir(path.join(outRoot, "uploads"), { recursive: true });

  for (let i = 0; i < FIXTURES.length; i++) {
    const fixture = FIXTURES[i];
    const original = await makePhoto(fixture.w, fixture.h, fixture.hue);

    const large = await sharp(original)
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const thumb = await sharp(original)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const largeMeta = await sharp(large).metadata();
    const lqip = await generateLqip(thumb);

    const inserted = await db
      .insert(images)
      .values({
        s3Key: "pending",
        width: largeMeta.width ?? fixture.w,
        height: largeMeta.height ?? fixture.h,
        name: fixture.caption,
        caption: fixture.caption,
        altText: fixture.caption,
        lqip
      })
      .returning();
    const id = inserted[0].id;

    const keyThumb = `uploads/${id}-thumb.jpg`;
    const keyLarge = `uploads/${id}-large.jpg`;
    const keyOriginal = `uploads/${id}-original.jpg`;

    await writeFile(path.join(outRoot, keyThumb), thumb);
    await writeFile(path.join(outRoot, keyLarge), large);
    await writeFile(path.join(outRoot, keyOriginal), original);

    await db
      .update(images)
      .set({
        s3Key: keyLarge,
        s3KeyThumb: keyThumb,
        s3KeyLarge: keyLarge,
        s3KeyOriginal: keyOriginal
      })
      .where(eq(images.id, id));

    await db.insert(albumImages).values({
      albumId: album.id,
      imageId: id,
      sortOrder: i
    });

    console.log(`  ${id}: ${fixture.w}x${fixture.h} lqip=${lqip.length}b`);
  }

  console.log(`\nWrote ${FIXTURES.length} fixtures to ${outRoot} and linked them to "${ALBUM_SLUG}".`);
}

main().catch((error) => {
  console.error("Fixture seed failed:", error);
  process.exit(1);
});
