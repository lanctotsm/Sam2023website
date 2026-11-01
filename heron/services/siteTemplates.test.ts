import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getJournalPreset } from "@/lib/siteTemplates/presets";

const tempDirs: string[] = [];
const originalDbPath = process.env.CMS_DB_PATH;

afterEach(() => {
  process.env.CMS_DB_PATH = originalDbPath;
  vi.resetModules();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("site template rows", () => {
  it("stores and deletes a named snapshot", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-templates-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    const { createSiteTemplate, deleteSiteTemplate, listSiteTemplates } = await import("./siteTemplates");
    const created = await createSiteTemplate("Winter", JSON.stringify(getJournalPreset().snapshot));
    const listed = await listSiteTemplates();
    expect(listed.map((row) => row.name)).toEqual(["Winter"]);
    expect(created.id).toBe(listed[0]?.id);

    const removed = await deleteSiteTemplate(created.id);
    expect(removed?.name).toBe("Winter");
    expect(await listSiteTemplates()).toEqual([]);
    expect(await deleteSiteTemplate(created.id)).toBeNull();
    sqlite.close();
  });
});
