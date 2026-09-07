import { test, expect } from "@playwright/test";
import { loginAsDevAdmin } from "./helpers/auth";

test.describe("Scheduled post visibility", () => {
  test("public post list omits a published post with a future published_at", async ({ page, request }) => {
    await loginAsDevAdmin(page);

    const slug = `e2e-scheduled-${Date.now()}`;
    const publishedAt = "2099-01-01T00:00:00.000Z";
    const create = await page.request.post("/api/posts", {
      data: {
        title: "E2E scheduled post",
        slug,
        markdown: "Scheduled body",
        status: "published",
        published_at: publishedAt
      }
    });

    let created: { id?: number; slug?: string; status?: string; published_at?: string | null } = {};
    try {
      created = (await create.json()) as typeof created;
    } catch {
      // Status assertion below still fails the test.
    }

    try {
      expect(create.status()).toBe(201);
      expect(created.slug).toBe(slug);
      expect(created.status).toBe("published");
      expect(created.published_at).toBe(publishedAt);

      const adminList = await page.request.get("/api/posts");
      expect(adminList.ok()).toBeTruthy();
      const adminPosts = (await adminList.json()) as { slug: string }[];
      expect(adminPosts.some((post) => post.slug === slug)).toBe(true);

      const publicList = await request.get("/api/posts");
      expect(publicList.ok()).toBeTruthy();
      const publicPosts = (await publicList.json()) as { slug: string }[];
      expect(publicPosts.some((post) => post.slug === slug)).toBe(false);

      const authenticated = await page.request.get(`/api/posts/${created.id}`);
      expect(authenticated.ok()).toBeTruthy();
    } finally {
      if (created.id) {
        await page.request.delete(`/api/posts/${created.id}`);
      }
    }
  });
});
