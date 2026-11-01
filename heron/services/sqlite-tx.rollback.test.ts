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
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows may still hold a handle to the temp SQLite file.
    }
  }
});

async function openTempCms() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-tx-"));
  tempDirs.push(dir);
  process.env.CMS_DB_PATH = path.join(dir, "cms.db");
  vi.resetModules();
  const { getRawDb } = await import("@/lib/db");
  const sqlite = getRawDb();
  sqlite.exec(`
    INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
    INSERT INTO albums (title, slug, created_by) VALUES ('A', 'a', 1);
    INSERT INTO images (s3_key, created_by) VALUES ('k1', 1), ('k2', 1), ('k3', 1);
    INSERT INTO album_images (album_id, image_id, sort_order) VALUES (1, 1, 10), (1, 2, 20);
    INSERT INTO posts (title, slug, markdown, created_by) VALUES ('T', 't', 'm', 1);
    INSERT INTO post_inline_images (post_id, image_id, source) VALUES (1, 3, 'upload_insert');
  `);
  return sqlite;
}

describe("sqlite write transactions", () => {
  it("rolls back album reorder when a later sort update fails", async () => {
    const sqlite = await openTempCms();
    sqlite.exec(`
      CREATE TRIGGER album_images_fail_sort_1
      BEFORE UPDATE ON album_images
      WHEN NEW.sort_order = 1
      BEGIN
        SELECT RAISE(ABORT, 'blocked');
      END;
    `);

    try {
      const { updateAlbumImagesOrder } = await import("./albumImages");
      await expect(updateAlbumImagesOrder(1, [1, 2])).rejects.toThrow();

      const rows = sqlite
        .prepare("SELECT image_id, sort_order FROM album_images ORDER BY image_id")
        .all() as { image_id: number; sort_order: number }[];
      expect(rows).toEqual([
        { image_id: 1, sort_order: 10 },
        { image_id: 2, sort_order: 20 }
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("rolls back inline-image replace when a later insert fails", async () => {
    const sqlite = await openTempCms();
    sqlite.exec(`
      CREATE TRIGGER post_inline_images_fail_image_2
      BEFORE INSERT ON post_inline_images
      WHEN NEW.image_id = 2
      BEGIN
        SELECT RAISE(ABORT, 'blocked');
      END;
    `);

    try {
      const { replacePostInlineImages, getPostInlineImageIds } = await import("./postInlineImages");
      await expect(replacePostInlineImages(1, [1, 2])).rejects.toThrow();
      await expect(getPostInlineImageIds(1)).resolves.toEqual([3]);
    } finally {
      sqlite.close();
    }
  });
});
