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
        // Capture the original so we can restore it — site_title is global state
        // (it feeds the <title>), and leaking a test value breaks other specs.
        const originalTitle = await titleInput.inputValue();

        const waitForSave = () =>
            page.waitForResponse(
                (res) => res.url().includes("/api/settings") && res.request().method() === "PUT"
            );

        await titleInput.fill("Playwright Test Site");
        let save = waitForSave();
        await page.locator("#settings-save-btn").click();
        expect((await save).status()).toBe(200);
        await expect(page.getByText("Settings saved!")).toBeVisible();

        // Restore original value so subsequent specs see the default title.
        await titleInput.fill(originalTitle);
        save = waitForSave();
        await page.locator("#settings-save-btn").click();
        expect((await save).status()).toBe(200);
    });

    test("page styles tab saves heading font without error", async ({ page }) => {
        await page.locator("#settings-tab-styles").click();
        await expect(page.getByRole("heading", { name: "Page Styles" })).toBeVisible();

        // The Home editor is the rounded-xl card whose heading is "🏠 Home Page".
        const homeEditor = page
            .locator("div.rounded-xl")
            .filter({ has: page.getByRole("heading", { name: "🏠 Home Page" }) });
        // The heading-font <select> is the one offering "Theme default (Roboto)"
        // (the body-font select offers "Theme default (Inter)" instead).
        const headingFontSelect = homeEditor.locator(
            'select:has(option:text-is("Theme default (Roboto)"))'
        );
        await headingFontSelect.selectOption("Montserrat");

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
