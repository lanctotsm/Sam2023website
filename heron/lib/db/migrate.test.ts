import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { migrateIfNeeded } from "./migrate";

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
});
