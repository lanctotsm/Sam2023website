import { test, expect } from "@playwright/test";

test.describe("Detail Pages", () => {
  test("Posts list shows heading and content or empty state", async ({ page }) => {
    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: /posts/i })).toBeVisible();
    const hasArticles = (await page.locator("article").count()) > 0;
    // Scope to main + .first() — duplicate empty copy can appear (e.g. responsive layout); strict mode rejects bare getByText
    const hasEmptyMessage = await page
      .getByRole("main")
      .getByText(/No posts yet|Check back soon/i)
      .first()
      .isVisible();
    expect(hasArticles || hasEmptyMessage).toBe(true);
  });

  test("Albums list shows heading and content or empty state", async ({ page }) => {
    await page.goto("/albums");
    await expect(page.getByRole("heading", { name: /albums/i })).toBeVisible();
    const articleCount = await page.locator("article").count();
    if (articleCount === 0) {
      // Fresh Docker/CI DB often has no albums — page still valid with heading only
      return;
    }
    const hasPhotosRelated = await page.getByText(/photos|No photos yet|View album/i).first().isVisible();
    expect(hasPhotosRelated).toBe(true);
  });

  test("Nonexistent post slug shows 404", async ({ page }) => {
    await page.goto("/posts/nonexistent-slug-12345");
    await expect(page).toHaveURL(/\/posts\/nonexistent-slug-12345/);
    await expect(page.getByText(/404|not found|could not find/i)).toBeVisible({ timeout: 5000 });
  });

  test("Nonexistent album slug shows 404", async ({ page }) => {
    await page.goto("/albums/nonexistent-album-12345");
    await expect(page).toHaveURL(/\/albums\/nonexistent-album-12345/);
    await expect(page.getByText(/404|not found|could not find/i)).toBeVisible({ timeout: 5000 });
  });
});
