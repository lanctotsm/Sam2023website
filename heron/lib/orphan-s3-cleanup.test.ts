import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupOptions, cleanupOrphanObjects, type CleanupOptions } from "./orphan-s3-cleanup";
import type { ListObjectsResult } from "./s3";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function temporaryPath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "heron-orphans-"));
  directories.push(directory);
  return path.join(directory, "cms.db");
}

function database(empty = false) {
  const dbPath = temporaryPath();
  const db = new Database(dbPath);
  db.exec("CREATE TABLE images (s3_key TEXT, s3_key_thumb TEXT, s3_key_large TEXT, s3_key_original TEXT)");
  if (!empty) {
    db.prepare("INSERT INTO images VALUES (?, ?, ?, ?)").run(
      "uploads/used/large.jpg", "uploads/used/thumb.jpg", null, "uploads/used/original.jpg"
    );
  }
  db.close();
  return dbPath;
}

function reference(dbPath: string, key: string) {
  const db = new Database(dbPath);
  try {
    db.prepare("INSERT INTO images (s3_key) VALUES (?)").run(key);
  } finally {
    db.close();
  }
}

function storage(objects: ListObjectsResult["objects"] = []) {
  return {
    listObjects: vi.fn().mockResolvedValue({ objects }),
    deleteObjects: vi.fn().mockResolvedValue(undefined)
  };
}

function options(dbPath: string, apply = true): CleanupOptions {
  return { dbPath, apply, minimumAgeHours: 24 };
}

const old = () => new Date(Date.now() - 48 * 60 * 60 * 1000);

describe("cleanup CLI options", () => {
  it("defaults to preview and a 24-hour grace period, even with legacy dry-run=false", () => {
    expect(cleanupOptions([], { CMS_DB_PATH: "/db/cms.db", CLEANUP_ORPHAN_DRY_RUN: "false" })).toEqual({
      dbPath: "/db/cms.db", apply: false, minimumAgeHours: 24
    });
    expect(cleanupOptions(["--apply"], { CMS_DB_PATH: "/db/cms.db" }).apply).toBe(true);
  });

  it.each(["0", "23", "-1", "NaN", "Infinity", "24hours", "24.5", "", "9007199254740992"])("rejects unsafe age %s", (age) => {
    expect(() => cleanupOptions([], { CMS_DB_PATH: "/db/cms.db", CLEANUP_ORPHAN_STALE_HOURS: age })).toThrow("at least 24");
  });

  it("rejects missing paths, unknown flags, and conflicting dry-run options", () => {
    expect(() => cleanupOptions([], {})).toThrow("CMS_DB_PATH");
    expect(() => cleanupOptions(["--aplpy"], { CMS_DB_PATH: "/db/cms.db" })).toThrow("Usage");
    expect(() => cleanupOptions(["--apply"], { CMS_DB_PATH: "/db/cms.db", CLEANUP_ORPHAN_DRY_RUN: "true" })).toThrow("Remove");
    expect(() => cleanupOptions([], { CMS_DB_PATH: "/db/cms.db", CLEANUP_ORPHAN_DRY_RUN: "tru" })).toThrow("true or false");
  });
});

describe("orphan cleanup", () => {
  it("stops before any S3 calls if the database is missing, without creating it", async () => {
    const dbPath = temporaryPath();
    const s3 = storage();
    await expect(cleanupOrphanObjects(options(dbPath), s3)).rejects.toThrow("Database not found");
    expect(fs.existsSync(dbPath)).toBe(false);
    expect(s3.listObjects).not.toHaveBeenCalled();
    expect(s3.deleteObjects).not.toHaveBeenCalled();
  });

  it.each(["corrupt", "wrong-schema", "empty"])("stops before S3 for a %s database", async (kind) => {
    const dbPath = kind === "empty" ? database(true) : temporaryPath();
    if (kind === "corrupt") fs.writeFileSync(dbPath, "not a sqlite database");
    if (kind === "wrong-schema") new Database(dbPath).close();
    const s3 = storage();
    await expect(cleanupOrphanObjects(options(dbPath), s3)).rejects.toThrow();
    expect(s3.listObjects).not.toHaveBeenCalled();
    expect(s3.deleteObjects).not.toHaveBeenCalled();
  });

  it("only reports candidates in the default dry run", async () => {
    const dbPath = database();
    const s3 = storage([{ key: "uploads/orphan.jpg", lastModified: old() }]);
    const log = vi.fn();
    await cleanupOrphanObjects(cleanupOptions([], { CMS_DB_PATH: dbPath }), s3, log);
    expect(s3.deleteObjects).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("  uploads/orphan.jpg");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Dry run"));
  });

  it("deletes only stale unreferenced uploads; keeps references, recent and unknown-age objects", async () => {
    const s3 = storage([
      { key: "uploads/orphan.jpg", lastModified: old() },
      { key: "uploads/used/large.jpg", lastModified: old() },
      { key: "uploads/used/thumb.jpg", lastModified: old() },
      { key: "uploads/used/original.jpg", lastModified: old() },
      { key: "uploads/new.jpg", lastModified: new Date() },
      { key: "uploads/unknown.jpg" },
      { key: "uploads/invalid.jpg", lastModified: new Date("invalid") },
      { key: "backups/file.gz", lastModified: old() }
    ]);
    await cleanupOrphanObjects(options(database()), s3, vi.fn());
    expect(s3.deleteObjects).toHaveBeenCalledExactlyOnceWith(["uploads/orphan.jpg"]);
  });

  it("follows pagination and rechecks references added while listing", async () => {
    const dbPath = database();
    const s3 = storage();
    s3.listObjects.mockResolvedValueOnce({
      objects: [{ key: "uploads/linked-during-list.jpg", lastModified: old() }],
      nextContinuationToken: "page-2"
    }).mockImplementationOnce(async () => {
      reference(dbPath, "uploads/linked-during-list.jpg");
      return { objects: [{ key: "uploads/orphan.jpg", lastModified: old() }] };
    });
    await cleanupOrphanObjects(options(dbPath), s3, vi.fn());
    expect(s3.listObjects).toHaveBeenLastCalledWith({ prefix: "uploads/", continuationToken: "page-2", maxKeys: 1000 });
    expect(s3.deleteObjects).toHaveBeenCalledExactlyOnceWith(["uploads/orphan.jpg"]);
  });

  it("rechecks the database between deletion batches", async () => {
    const dbPath = database();
    const objects = Array.from({ length: 1001 }, (_, index) => ({ key: `uploads/orphan-${index}.jpg`, lastModified: old() }));
    const s3 = storage(objects);
    s3.deleteObjects.mockImplementationOnce(async () => reference(dbPath, "uploads/orphan-1000.jpg"));
    await cleanupOrphanObjects(options(dbPath), s3, vi.fn());
    expect(s3.deleteObjects).toHaveBeenCalledTimes(1);
    expect(s3.deleteObjects.mock.calls[0][0]).toHaveLength(1000);
  });

  it("stops deletion if the database disappears during listing", async () => {
    const dbPath = database();
    const s3 = storage();
    s3.listObjects.mockImplementationOnce(async () => {
      fs.unlinkSync(dbPath);
      return { objects: [{ key: "uploads/orphan.jpg", lastModified: old() }] };
    });
    await expect(cleanupOrphanObjects(options(dbPath), s3, vi.fn())).rejects.toThrow("Database not found");
    expect(s3.deleteObjects).not.toHaveBeenCalled();
  });
});
