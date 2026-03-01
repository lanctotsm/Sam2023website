import { test, expect } from "@playwright/test";

test.describe("Public Routes", () => {
  test("Home page loads and shows navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Sam's website/);
    await expect(page.getByRole("navigation").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /About/i }).first()).toBeVisible();
  });

  test("Posts page loads", async ({ page }) => {
    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: /posts/i })).toBeVisible();
  });

  test("Albums page loads", async ({ page }) => {
    await page.goto("/albums");
    await expect(page.getByRole("heading", { name: /albums/i })).toBeVisible();
  });

});

test.describe("Admin Protection", () => {
  test("Admin shows sign-in prompt when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: /Admin/i }).first()).toBeVisible();
  });
});
