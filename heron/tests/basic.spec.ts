import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Samuel Lanctot/);
});

test("public pages have distinct metadata and a working share image", async ({ page, request }) => {
  for (const [path, title] of [["/", "Samuel Lanctot"], ["/posts", "Posts"], ["/albums", "Photography"]]) {
    await page.goto(path);
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute("content", "Modern SQLite CMS");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(path, "http://localhost:3000").href.replace(/\/$/, ""));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/social-image$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  }
  const image = await request.get("/social-image");
  expect(image.ok()).toBeTruthy();
  expect(image.headers()["content-type"]).toContain("image/png");
  expect((await image.body()).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});

test("navigation links are present", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation").first();
  await expect(nav).toBeVisible();
  await expect(page.getByRole("link", { name: /About/i }).first()).toBeVisible();
});
