import { test, expect } from "@playwright/test";
import { loginAsDevAdmin } from "./helpers/auth";

test.describe("Admin settings UI", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsDevAdmin(page);
        await page.goto("/admin/settings");
        await expect(page.getByRole("heading", { name: "Admin Settings" })).toBeVisible();
        await expect(page.getByText("Loading settings…")).toHaveCount(0);
    });

    test("shows all settings tabs", async ({ page }) => {
        await expect(page.getByRole("button", { name: "⚙️ General" })).toBeVisible();
        await expect(page.getByRole("button", { name: "🏠 Home Page" })).toBeVisible();
        await expect(page.getByRole("button", { name: "🎨 Page Styles" })).toBeVisible();
    });

    test("general tab saves site title", async ({ page }) => {
        const titleInput = page.locator("#settings-site-title");
        await titleInput.fill("Playwright Test Site");

        const saveResponse = page.waitForResponse(
            (res) => res.url().includes("/api/settings") && res.request().method() === "PUT"
        );
        await page.locator("#settings-save-btn").click();

        const response = await saveResponse;
        expect(response.status()).toBe(200);
        await expect(page.getByText("Settings saved!")).toBeVisible();
    });

    test("page styles tab saves heading font without error", async ({ page }) => {
        await page.locator("#settings-tab-styles").click();
        await expect(page.getByRole("heading", { name: "Page Styles" })).toBeVisible();

        const homeEditor = page.locator("div.rounded-xl.border").filter({ hasText: "🏠 Home Page" });
        await homeEditor.locator("select").first().selectOption("Montserrat");

        const saveResponse = page.waitForResponse(
            (res) => res.url().includes("/api/settings") && res.request().method() === "PUT"
        );
        await page.locator("#settings-save-btn").click();

        const response = await saveResponse;
        expect(response.status()).toBe(200);
        await expect(page.getByText("Settings saved!")).toBeVisible();
    });

    test("home page tab shows section editor", async ({ page }) => {
        await page.locator("#settings-tab-homepage").click();
        await expect(page.getByRole("heading", { name: "Homepage sections" })).toBeVisible();
        await expect(page.getByRole("button", { name: "+ Text block" })).toBeVisible();
    });
});
