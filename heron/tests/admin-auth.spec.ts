import { test, expect } from "@playwright/test";
import { loginAsDevAdmin } from "./helpers/auth";

test.describe("Admin authentication UI", () => {
    test("dev login exposes admin navigation", async ({ page }) => {
        await loginAsDevAdmin(page);

        await expect(page.getByRole("link", { name: "Posts" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Albums" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
    });

    test("settings page requires authentication", async ({ page }) => {
        await page.goto("/admin/settings");
        await expect(page.getByRole("button", { name: "Sign in with Dev Login" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Admin Settings" })).toHaveCount(0);
    });
});
