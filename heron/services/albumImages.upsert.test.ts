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

describe("addAlbumImage sqlite upsert", () => {
  it("updates sort order when the album/image pair already exists", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-album-upsert-"));
    tempDirs.push(dir);
    const dbPath = path.join(dir, "cms.db");
    process.env.CMS_DB_PATH = dbPath;
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO albums (title, slug, created_by) VALUES ('A', 'a', 1);
      INSERT INTO images (s3_key, created_by) VALUES ('uploads/test.jpg', 1);
    `);

    const { addAlbumImage, getAlbumImages } = await import("./albumImages");
    await addAlbumImage(1, 1, 0);
    await expect(addAlbumImage(1, 1, 4)).resolves.toBeUndefined();

    const rows = await getAlbumImages(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].sortOrder).toBe(4);

    sqlite.close();
  });
});
