import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Login/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  });

  test("unauthorized admin shows sign-in prompt", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: /Admin/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  });
});

test.describe("Public pages", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("resume page loads", async ({ page }) => {
    await page.goto("/resume");
    await expect(page).toHaveURL(/\/resume/);
    await expect(page.getByRole("heading", { name: /Samuel Lanctot/i })).toBeVisible();
  });
});
