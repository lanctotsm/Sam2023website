import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const recorded = vi.hoisted(() => ({ keys: [] as string[][] }));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>, key: string[]) => {
    return async () => {
      recorded.keys.push([...key]);
      return fn();
    };
  },
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}));

const tempDirs: string[] = [];
const originalDbPath = process.env.CMS_DB_PATH;

afterEach(() => {
  process.env.CMS_DB_PATH = originalDbPath;
  recorded.keys = [];
  vi.resetModules();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("scheduled public post cache", () => {
  it("reads the post only after its publication window changes", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-public-schedule-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const publishedAt = new Date(Date.now() + 800).toISOString();
    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO posts (title, slug, markdown, status, published_at, created_by)
      VALUES ('Soon', 'soon', 'body', 'published', '${publishedAt}', 1);
    `);

    const { getCachedPublicPosts, getCachedPublicPost } = await import("./public-content");
    const beforeList = await getCachedPublicPosts();
    const beforePost = await getCachedPublicPost("soon");
    const beforeKeys = recorded.keys.map((key) => key.join("|"));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const afterList = await getCachedPublicPosts();
    const afterPost = await getCachedPublicPost("soon");
    sqlite.close();

    expect(beforeList.map((post) => post.slug)).not.toContain("soon");
    expect(beforePost).toBeNull();
    expect(afterList.map((post) => post.slug)).toContain("soon");
    expect(afterPost?.slug).toBe("soon");

    const afterKeys = recorded.keys.map((key) => key.join("|"));
    expect(beforeKeys[0]).not.toBe(afterKeys[2]);
    expect(beforeKeys[1]).not.toBe(afterKeys[3]);
    expect(afterKeys[2]).toMatch(/open$/);
    expect(afterKeys[3]).toMatch(/open$/);
  });
});
