import { expect, type Page } from "@playwright/test";

/** Sign in via Dev Login (localhost + DEV_AUTH_BYPASS in Docker CI). */
export async function loginAsDevAdmin(page: Page) {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Admin/i }).first()).toBeVisible();

    const devLoginBtn = page.getByRole("button", { name: "Sign in with Dev Login" });
    await expect(devLoginBtn).toBeVisible();
    await devLoginBtn.click();

    await expect(page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Settings" }) })).toBeVisible({
        timeout: 15_000,
    });
}
