import { test, expect } from "@playwright/test";

test.describe("Public Routes", () => {
  test("Home page loads and shows navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Heron/);
    
    // Check for navigation links
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /posts/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /albums/i })).toBeVisible();
  });

  test("Posts page loads", async ({ page }) => {
    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: /posts/i })).toBeVisible();
  });

  test("Albums page loads", async ({ page }) => {
    await page.goto("/albums");
    await expect(page.getByRole("heading", { name: /albums/i })).toBeVisible();
  });

  test("Login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });
});

test.describe("Admin Protection", () => {
  test("Admin dashboard redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    // Next-auth usually redirects to the sign-in page or shows a specific UI
    // In your app, check where it goes
    await expect(page).toHaveURL(/\/login|api\/auth\/signin/);
  });
});
