import { test, expect } from "@playwright/test";

test.describe("Detail Pages", () => {
  test("Posts list shows heading and content or empty state", async ({ page }) => {
    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: /posts/i })).toBeVisible();
    const hasArticles = (await page.locator("article").count()) > 0;
    const hasEmptyMessage = await page.getByText(/No posts yet|Check back soon/i).isVisible();
    expect(hasArticles || hasEmptyMessage).toBe(true);
  });

  test("Albums list shows heading and content", async ({ page }) => {
    await page.goto("/albums");
    await expect(page.getByRole("heading", { name: /albums/i })).toBeVisible();
    const hasContent = (await page.locator("article").count()) > 0 || await page.getByText(/photos/i).isVisible();
    expect(hasContent).toBe(true);
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
