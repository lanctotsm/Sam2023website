import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonRequest } from "../__tests__/helpers";

vi.mock("@/lib/api-utils", async () => ({
  getAuthUser: vi.fn().mockResolvedValue({ id: 1, email: "test@example.com", role: "admin" }),
  parseId: (await import("@/lib/parse-id")).parseId,
  errorResponse: (error: string, status: number) => new Response(JSON.stringify({ error }), { status })
}));

vi.mock("@/lib/revalidate-public", () => ({ revalidatePublicContent: vi.fn() }));

let sqlite: Database.Database;
let tempDir: string;
const post = { title: "Changed", slug: "changed", markdown: "Changed body", status: "published" };
const params = { params: Promise.resolve({ postID: "1" }) };

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-post-save-"));
  vi.stubEnv("CMS_DB_PATH", path.join(tempDir, "cms.db"));
  const { getRawDb } = await import("@/lib/db");
  sqlite = getRawDb();
  sqlite.exec(`
    INSERT INTO users (google_id, email) VALUES ('g1', 'test@example.com');
    INSERT INTO images (s3_key, created_by) VALUES ('image-1', 1), ('image-2', 1);
    INSERT INTO posts (title, slug, markdown, created_by) VALUES ('Original', 'original', 'Original body', 1);
    INSERT INTO post_inline_images (post_id, image_id) VALUES (1, 1);
  `);
});

afterEach(() => {
  sqlite?.close();
  vi.unstubAllEnvs();
  vi.resetModules();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("post saves against SQLite", () => {
  it("rolls back a new post when an image reference fails", async () => {
    const { POST } = await import("./route");
    const { revalidatePublicContent } = await import("@/lib/revalidate-public");
    const response = await POST(jsonRequest("POST", "http://x/api/posts", { ...post, inline_image_ids: [2, 999] }));

    expect(response.status).toBe(400);
    expect(sqlite.prepare("SELECT slug FROM posts ORDER BY id").all()).toEqual([{ slug: "original" }]);
    expect(sqlite.prepare("SELECT post_id, image_id FROM post_inline_images").all()).toEqual([{ post_id: 1, image_id: 1 }]);
    expect(revalidatePublicContent).not.toHaveBeenCalled();
  });

  it("restores the entire existing post and its image references after a later insert fails", async () => {
    const before = sqlite.prepare("SELECT * FROM posts WHERE id = 1").get();
    sqlite.exec(`
      CREATE TRIGGER fail_image_2 BEFORE INSERT ON post_inline_images
      WHEN NEW.image_id = 2 BEGIN SELECT RAISE(ABORT, 'blocked'); END;
    `);
    const { PUT } = await import("./[postID]/route");
    const { revalidatePublicContent } = await import("@/lib/revalidate-public");
    const response = await PUT(jsonRequest("PUT", "http://x/api/posts/1", { ...post, inline_image_ids: [1, 2] }), params);

    expect(response.status).toBe(500);
    expect(sqlite.prepare("SELECT * FROM posts WHERE id = 1").get()).toEqual(before);
    expect(sqlite.prepare("SELECT image_id FROM post_inline_images WHERE post_id = 1").all()).toEqual([{ image_id: 1 }]);
    expect(revalidatePublicContent).not.toHaveBeenCalled();
  });

  it("creates a post and its image relationships together", async () => {
    const { POST } = await import("./route");
    const response = await POST(jsonRequest("POST", "http://x/api/posts", { ...post, inline_image_ids: [2, 2] }));
    expect(response.status).toBe(201);
    const created = await response.json();
    expect(created.inline_image_ids).toEqual([2]);
    expect(sqlite.prepare("SELECT image_id FROM post_inline_images WHERE post_id = ?").all(created.id)).toEqual([{ image_id: 2 }]);
  });

  it("preserves omitted relationships, replaces provided ones, and supports clearing", async () => {
    const { PUT } = await import("./[postID]/route");
    const { revalidatePublicContent } = await import("@/lib/revalidate-public");
    const omitted = await PUT(jsonRequest("PUT", "http://x", post), params);
    expect(omitted.status).toBe(200);
    expect((await omitted.json()).inline_image_ids).toEqual([1]);

    const replaced = await PUT(jsonRequest("PUT", "http://x", { ...post, inline_image_ids: [2] }), params);
    expect(replaced.status).toBe(200);
    expect((await replaced.json()).inline_image_ids).toEqual([2]);

    const cleared = await PUT(jsonRequest("PUT", "http://x", { ...post, inline_image_ids: [] }), params);
    expect(cleared.status).toBe(200);
    expect((await cleared.json()).inline_image_ids).toEqual([]);
    expect(sqlite.prepare("SELECT * FROM post_inline_images").all()).toEqual([]);
    expect(revalidatePublicContent).toHaveBeenCalledTimes(3);
  });

  it("returns a conflict for duplicate slugs without changing either post", async () => {
    sqlite.exec("INSERT INTO posts (title, slug, markdown, created_by) VALUES ('Second', 'second', 'Body', 1)");
    const { POST } = await import("./route");
    const { PUT } = await import("./[postID]/route");
    const { revalidatePublicContent } = await import("@/lib/revalidate-public");
    const create = await POST(jsonRequest("POST", "http://x", { ...post, slug: "original" }));
    const update = await PUT(jsonRequest("PUT", "http://x", { ...post, slug: "second" }), params);

    expect(create.status).toBe(409);
    expect(update.status).toBe(409);
    expect((await update.json()).error).toBe("a post with that slug already exists");
    expect(sqlite.prepare("SELECT title, slug FROM posts ORDER BY id").all()).toEqual([
      { title: "Original", slug: "original" }, { title: "Second", slug: "second" }
    ]);
    expect(revalidatePublicContent).not.toHaveBeenCalled();
  });

  it.each(["{", "null", "[]", JSON.stringify({ ...post, title: 1 }), JSON.stringify({ ...post, metadata: { bad: [] } })])(
    "returns 400 for malformed input to both routes: %s", async (body) => {
      const { POST } = await import("./route");
      const { PUT } = await import("./[postID]/route");
      const { revalidatePublicContent } = await import("@/lib/revalidate-public");
      expect((await POST(new Request("http://x", { method: "POST", body }))).status).toBe(400);
      expect((await PUT(new Request("http://x", { method: "PUT", body }), params)).status).toBe(400);
      expect(sqlite.prepare("SELECT title FROM posts").all()).toEqual([{ title: "Original" }]);
      expect(revalidatePublicContent).not.toHaveBeenCalled();
    }
  );
});
