import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const tempDirs: string[] = [];
const originalDbPath = process.env.CMS_DB_PATH;

afterEach(() => {
  process.env.CMS_DB_PATH = originalDbPath;
  vi.resetModules();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("getAllAlbums", () => {
  it("returns the first photo as the cover and the photo count in one query", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-albums-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO albums (title, slug, description, created_by) VALUES ('Trip', 'trip', 'Notes', 1), ('Empty', 'empty', NULL, 1);
      INSERT INTO images (s3_key, s3_key_thumb, created_by) VALUES
        ('uploads/late.jpg', 'uploads/late-thumb.jpg', 1),
        ('uploads/first.jpg', 'uploads/first-thumb.jpg', 1);
      INSERT INTO album_images (album_id, image_id, sort_order) VALUES (1, 1, 2), (1, 2, 0);
    `);

    const { getAllAlbums } = await import("./albums");
    const rows = await getAllAlbums();
    sqlite.close();

    const trip = rows.find((row) => row.slug === "trip");
    const empty = rows.find((row) => row.slug === "empty");
    expect(trip?.coverImageS3Key).toBe("uploads/first-thumb.jpg");
    expect(Number(trip?.photoCount)).toBe(2);
    expect(empty?.coverImageS3Key).toBeNull();
    expect(Number(empty?.photoCount)).toBe(0);
  });

  it("prefers the cover override and hides drafts from the public list", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-albums-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO albums (title, slug, created_by, status, cover_image_id, display_date) VALUES
        ('Trip', 'trip', 1, 'published', 1, '2024-06-01'),
        ('Secret', 'secret', 1, 'draft', NULL, NULL);
      INSERT INTO images (s3_key, s3_key_thumb, created_by) VALUES
        ('uploads/override.jpg', 'uploads/override-thumb.jpg', 1),
        ('uploads/first.jpg', 'uploads/first-thumb.jpg', 1);
      INSERT INTO album_images (album_id, image_id, sort_order) VALUES (1, 2, 0);
    `);

    const { getAllAlbums } = await import("./albums");
    const publicRows = await getAllAlbums();
    const adminRows = await getAllAlbums({ includeDrafts: true });
    sqlite.close();

    expect(publicRows.map((row) => row.slug)).toEqual(["trip"]);
    expect(publicRows[0]?.coverImageS3Key).toBe("uploads/override-thumb.jpg");
    expect(publicRows[0]?.displayDate).toBe("2024-06-01");
    expect(adminRows.map((row) => row.slug).sort()).toEqual(["secret", "trip"]);
  });
});
