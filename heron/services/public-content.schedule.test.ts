import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const recorded = vi.hoisted(() => ({ lives: [] as unknown[] }));

vi.mock("next/cache", () => ({
  cacheLife: (profile: unknown) => {
    recorded.lives.push(profile);
  },
  cacheTag: vi.fn()
}));

const tempDirs: string[] = [];
const originalDbPath = process.env.CMS_DB_PATH;

afterEach(() => {
  vi.useRealTimers();
  process.env.CMS_DB_PATH = originalDbPath;
  recorded.lives = [];
  vi.resetModules();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("scheduled public post cache", () => {
  it("hides a scheduled post until it is public and shortens the cache until then", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-public-schedule-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    const { getCachedPublicPosts, getCachedPublicPost } = await import("./public-content");

    // Importing the db can take longer than a short wall-clock delay on CI,
    // which used to publish the post before the first read. Freeze Date and
    // step it past publication instead.
    vi.useFakeTimers({ toFake: ["Date"] });
    const publishedAt = new Date(Date.now() + 60_000).toISOString();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO posts (title, slug, markdown, status, published_at, created_by)
      VALUES ('Soon', 'soon', 'body', 'published', '${publishedAt}', 1);
    `);

    const beforeList = await getCachedPublicPosts();
    const beforePost = await getCachedPublicPost("soon");

    vi.setSystemTime(Date.now() + 61_000);

    const afterList = await getCachedPublicPosts();
    const afterPost = await getCachedPublicPost("soon");
    sqlite.close();
    vi.useRealTimers();

    expect(beforeList.map((post) => post.slug)).not.toContain("soon");
    expect(beforePost).toBeNull();
    expect(afterList.map((post) => post.slug)).toContain("soon");
    expect(afterPost?.slug).toBe("soon");

    const [listBefore, postBefore, listAfter, postAfter] = recorded.lives;
    expect(listBefore).toMatchObject({ expire: expect.any(Number) });
    expect((listBefore as { expire: number }).expire).toBeLessThan(3600);
    expect(postBefore).toMatchObject({ expire: expect.any(Number) });
    expect((postBefore as { expire: number }).expire).toBeLessThan(3600);
    expect(listAfter).toBe("hours");
    expect(postAfter).toBe("hours");
  });
});
