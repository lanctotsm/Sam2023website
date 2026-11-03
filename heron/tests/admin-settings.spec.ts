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

        try {
            await titleInput.fill("Playwright Test Site");
            const save = waitForSave();
            await page.locator("#settings-save-btn").click();
            expect((await save).status()).toBe(200);
            await expect(page.getByText(/Settings saved at/)).toBeVisible();
        } finally {
            // Restore original value even if the test fails mid-way, so
            // subsequent runs don't see a leaked "Playwright Test Site" title.
            await titleInput.fill(originalTitle);
            const restore = waitForSave();
            await page.locator("#settings-save-btn").click();
            await restore;
        }
    });

    test("page styles tab saves heading font without error", async ({ page }) => {
        await page.locator("#settings-tab-styles").click();
        await expect(page.getByRole("heading", { name: "Page Styles" })).toBeVisible();

        // The Home editor is the rounded-xl card whose heading is "🏠 Home Page".
        const homeEditor = page
            .locator("div.rounded-xl")
            .filter({ has: page.getByRole("heading", { name: "🏠 Home Page" }) });
        // The heading-font <select> is the one offering "Theme default (Fraunces)"
        // (the body-font select offers "Theme default (Inter)" instead).
        const headingFontSelect = homeEditor.locator(
            'select:has(option:text-is("Theme default (Fraunces)"))'
        );
        await headingFontSelect.selectOption("Montserrat");

        const saveResponse = page.waitForResponse(
            (res) => res.url().includes("/api/settings") && res.request().method() === "PUT"
        );
        await page.locator("#settings-save-btn").click();

        const response = await saveResponse;
        expect(response.status()).toBe(200);
        await expect(page.getByText(/Settings saved at/)).toBeVisible();
    });

    test("home page tab shows section editor", async ({ page }) => {
        await page.locator("#settings-tab-homepage").click();
        await expect(page.getByRole("heading", { name: "Homepage sections" })).toBeVisible();
        await expect(page.getByRole("button", { name: "+ Text block" })).toBeVisible();
    });

    test("home page editor saves an arbitrary icon and renders it publicly", async ({ page }) => {
        const original = await page.request.get("/api/settings?key=front_page");
        expect(original.ok()).toBeTruthy();
        const { value } = await original.json();

        try {
            await page.locator("#settings-tab-homepage").click();
            await page.locator('select:has(option[value="tag-list"])').selectOption("tag-list");
            const editor = page.locator("section").filter({
                has: page.getByRole("heading", { name: "Tag list", exact: true })
            });
            await editor.getByRole("button", { name: "+ Add tag", exact: true }).click();
            await editor.getByRole("button", { name: "Star", exact: true }).click();
            await editor.getByPlaceholder("Search icons…").fill("Origami");
            await editor.locator('button[title="Origami"]').click();
            await editor.getByPlaceholder("Label", { exact: true }).fill("Folded paper test");

            const saved = page.waitForResponse(
                (response) => response.url().includes("/api/settings") && response.request().method() === "PUT"
            );
            await page.locator("#settings-save-btn").click();
            expect((await saved).ok()).toBeTruthy();

            await page.goto("/");
            await expect(page.getByText("Folded paper test", { exact: true })).toBeVisible();
            await expect(page.locator("main svg.lucide-origami")).toBeVisible();
        } finally {
            const restored = await page.request.put("/api/settings", {
                data: { key: "front_page", value: value ?? "" }
            });
            expect(restored.ok()).toBeTruthy();
        }
    });
});
