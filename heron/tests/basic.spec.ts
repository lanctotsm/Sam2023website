import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Heron/);
});

test("navigation links are present", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("nav");
  await expect(nav).toBeVisible();
});
