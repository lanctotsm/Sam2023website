import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { migrateIfNeeded } from "./migrate";
import { legacyBuiltInFrontPage } from "../siteTemplates/legacyDefault";
import { JOURNAL_TEMPLATE_ID } from "../siteTemplates/presets";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows may still hold a handle to the temp SQLite file.
    }
  }
});

describe("migrateIfNeeded", () => {
  it("can be applied again on a second connection to the same file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-migrate-"));
    tempDirs.push(dir);
    const dbPath = path.join(dir, "cms.db");

    const first = new Database(dbPath, { timeout: 8000 });
    migrateIfNeeded(first);
    const firstCount = (
      first.prepare("SELECT COUNT(*) as count FROM _migrations").get() as { count: number }
    ).count;
    first.close();

    const second = new Database(dbPath, { timeout: 8000 });
    expect(() => migrateIfNeeded(second)).not.toThrow();
    const secondCount = (
      second.prepare("SELECT COUNT(*) as count FROM _migrations").get() as { count: number }
    ).count;
    second.close();

    expect(firstCount).toBeGreaterThan(0);
    expect(secondCount).toBe(firstCount);
  });

  it("drops unused leftover tables", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-migrate-"));
    tempDirs.push(dir);
    const sqlite = new Database(path.join(dir, "cms.db"), { timeout: 8000 });
    migrateIfNeeded(sqlite);

    const leftover = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('post_album_links', 'sessions', 'oauth_states')"
      )
      .all();
    sqlite.close();

    expect(leftover).toEqual([]);
  });

  it("writes Journal on an untouched database and leaves a styled site alone", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-migrate-"));
    tempDirs.push(dir);
    const sqlite = new Database(path.join(dir, "cms.db"), { timeout: 8000 });
    migrateIfNeeded(sqlite);

    const read = (key: string) =>
      (sqlite.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined)?.value;
    const front = JSON.parse(read("front_page") || "{}") as { sections: { templateId: string; data: { variant?: string } }[] };
    expect(front.sections.map((section) => section.templateId)).toEqual([
      "banner",
      "text-block",
      "recent-work",
      "contact",
    ]);
    expect(front.sections[0]?.data.variant).toBe("canvas");
    expect(read("active_template")).toBe(JOURNAL_TEMPLATE_ID);

    sqlite.prepare("UPDATE settings SET value = ? WHERE key = 'front_page'").run(JSON.stringify(legacyBuiltInFrontPage));
    sqlite.prepare("DELETE FROM settings WHERE key IN ('page_styles', 'nav_styles', 'active_template')").run();
    migrateIfNeeded(sqlite);
    expect(read("active_template")).toBe(JOURNAL_TEMPLATE_ID);

    sqlite.prepare("UPDATE settings SET value = ? WHERE key = 'front_page'").run(JSON.stringify(legacyBuiltInFrontPage));
    sqlite
      .prepare(
        "INSERT INTO settings (key, value) VALUES ('page_styles', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      )
      .run(JSON.stringify({ home: { style: { headingFont: "Roboto" } } }));
    sqlite.prepare("DELETE FROM settings WHERE key = 'active_template'").run();
    migrateIfNeeded(sqlite);
    expect(JSON.parse(read("front_page") || "{}")).toEqual(legacyBuiltInFrontPage);
    expect(read("active_template")).toBeUndefined();
    sqlite.close();
  });
});
