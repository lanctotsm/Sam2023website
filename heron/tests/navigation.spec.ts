import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    // Check for "Log in" button
    await expect(page.getByRole("button", { name: /Log in/i })).toBeVisible();
  });

  test("unauthorized access redirects or shows error", async ({ page }) => {
    // Attempting to visit an admin page without being logged in
    await page.goto("/admin");
    // Depending on implementation, it might redirect to /login or show a 401
    // Usually NextAuth redirects to signin or we handle it in middleware
    await expect(page).toHaveURL(/\/login|api\/auth\/signin/);
  });
});

test.describe("Public pages", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("resume page loads", async ({ page }) => {
    await page.goto("/resume");
    await expect(page.locator("h1")).toContainText(/Resume/i);
  });
});
