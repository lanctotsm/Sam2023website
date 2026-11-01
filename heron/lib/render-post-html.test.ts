import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderPostHtml } from "./render-post-html";

const tempDirs: string[] = [];
const originalDbPath = process.env.CMS_DB_PATH;

afterEach(() => {
  process.env.CMS_DB_PATH = originalDbPath;
  vi.resetModules();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("renderPostHtml", () => {
  it("drops unsafe markdown URLs before the HTML is stored", async () => {
    const html = await renderPostHtml("[click](javascript:alert(1)) and [ok](https://example.com)");
    expect(html).not.toMatch(/javascript:/i);
    expect(html).toContain("https://example.com");
    expect(html).toContain("click");
  });

  it("renders markdown once, including emphasis", async () => {
    const html = await renderPostHtml("Hello **world**");
    expect(html).toContain("<strong>world</strong>");
    expect(html).not.toContain("**world**");
  });

  it("embeds an album's photos as stored HTML", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-html-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO albums (title, slug, created_by) VALUES ('Harbor', 'harbor', 1);
      INSERT INTO images (s3_key, s3_key_thumb, alt_text, created_by) VALUES
        ('uploads/boat.jpg', 'uploads/boat-thumb.jpg', 'A boat', 1);
      INSERT INTO album_images (album_id, image_id, sort_order) VALUES (1, 1, 0);
    `);

    const { renderPostHtml: render } = await import("./render-post-html");
    const html = await render("See [[album:harbor]] today.");
    sqlite.close();
    expect(html).toContain("Harbor");
    expect(html).toContain("uploads/boat-thumb.jpg");
    expect(html).toContain('href="/albums/harbor?photo=1"');
    expect(html).toContain("today");
    expect(html).not.toContain("[[album:harbor]]");
  });

  it("does not embed photos from a draft album", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "heron-html-draft-"));
    tempDirs.push(dir);
    process.env.CMS_DB_PATH = path.join(dir, "cms.db");
    vi.resetModules();

    const { getRawDb } = await import("@/lib/db");
    const sqlite = getRawDb();
    sqlite.exec(`
      INSERT INTO users (google_id, email) VALUES ('g1', 'a@example.com');
      INSERT INTO albums (title, slug, status, created_by) VALUES ('Secret', 'secret', 'draft', 1);
      INSERT INTO images (s3_key, s3_key_thumb, created_by) VALUES ('uploads/secret.jpg', 'uploads/secret-thumb.jpg', 1);
      INSERT INTO album_images (album_id, image_id, sort_order) VALUES (1, 1, 0);
    `);

    const { renderPostHtml: render } = await import("./render-post-html");
    const html = await render("Look [[album:secret]]");
    sqlite.close();
    expect(html).toContain("Album not found");
    expect(html).not.toContain("uploads/secret");
  });

  it("keeps each render's shortcodes when two renders run together", async () => {
    const [first, second] = await Promise.all([
      renderPostHtml("Start [[album:one]] end-one"),
      renderPostHtml("Start [[album:two]] end-two")
    ]);
    expect(first).toContain("end-one");
    expect(first).toContain("one");
    expect(second).toContain("end-two");
    expect(second).toContain("two");
  });
});
