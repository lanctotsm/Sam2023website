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

describe("stored post html", () => {
  it("refreshes posts that embed an album when the album is saved", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-embed-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO albums (title, slug, created_by) VALUES ('Harbor', 'harbor', 1);
      INSERT INTO posts (title, slug, markdown, status, created_by)
        VALUES ('Trip', 'trip', 'Before [[album:harbor]] after', 'published', 1);
    `);

    const { updateAlbum } = await import("./albums");
    await updateAlbum(1, { title: "Harbor Lights", slug: "harbor", description: "" });

    const row = sqlite.prepare("SELECT html FROM posts WHERE id = 1").get() as { html: string };
    sqlite.close();
    expect(row.html).toContain("Harbor Lights");
    expect(row.html).not.toContain("[[album:harbor]]");
  });
});
