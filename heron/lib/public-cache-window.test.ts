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

describe("nextScheduledPublicationMs", () => {
  it("returns the soonest future publication, scoped to a slug when asked", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-cache-window-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const soon = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const later = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO posts (title, slug, markdown, status, published_at, created_by) VALUES
        ('Soon', 'soon', 'body', 'published', '${soon}', 1),
        ('Later', 'later', 'body', 'published', '${later}', 1),
        ('Draft', 'draft', 'body', 'draft', '${soon}', 1);
    `);

    const { nextScheduledPublicationMs } = await import("./public-cache-window");
    const next = await nextScheduledPublicationMs();
    const onlyLater = await nextScheduledPublicationMs("later");
    sqlite.close();

    expect(next).toBe(Date.parse(soon));
    expect(onlyLater).toBe(Date.parse(later));
  });
});
