import { test, expect } from "@playwright/test";
import { loginAsDevAdmin } from "./helpers/auth";

test.describe("Scheduled post visibility", () => {
  test("public post list omits a published post with a future published_at", async ({ page, request }) => {
    await loginAsDevAdmin(page);

    const slug = `e2e-scheduled-${Date.now()}`;
    const create = await page.request.post("/api/posts", {
      data: {
        title: "E2E scheduled post",
        slug,
        markdown: "Scheduled body",
        status: "published",
        published_at: "2099-01-01T00:00:00.000Z"
      }
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { id: number };

    try {
      const publicList = await request.get("/api/posts");
      expect(publicList.ok()).toBeTruthy();
      const posts = (await publicList.json()) as { slug: string }[];
      expect(posts.some((post) => post.slug === slug)).toBe(false);

      const authenticated = await page.request.get(`/api/posts/${created.id}`);
      expect(authenticated.ok()).toBeTruthy();
    } finally {
      await page.request.delete(`/api/posts/${created.id}`);
    }
  });
});
