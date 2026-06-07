import { test, expect } from "@playwright/test";
import { loginAsDevAdmin } from "./helpers/auth";

test.describe("Admin authentication UI", () => {
    test("dev login exposes admin navigation", async ({ page }) => {
        await loginAsDevAdmin(page);

        // Scope to the admin sub-nav (the only <nav> inside a <header>) to avoid
        // matching the main site navigation, which has its own Posts/Albums links.
        const adminNav = page.locator("header nav");
        await expect(adminNav.getByRole("link", { name: "Posts", exact: true })).toBeVisible();
        await expect(adminNav.getByRole("link", { name: "Albums", exact: true })).toBeVisible();
        await expect(adminNav.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
    });

    test("settings page requires authentication", async ({ page }) => {
        await page.goto("/admin/settings");
        await expect(page.getByRole("button", { name: "Sign in with Dev Login" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Admin Settings" })).toHaveCount(0);
    });
});
