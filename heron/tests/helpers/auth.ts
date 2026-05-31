import { expect, type Page } from "@playwright/test";

/**
 * Sign in via Dev Login (available on localhost when DEV_AUTH_BYPASS=true).
 * After the credentials sign-in the page reloads and the main nav shows the
 * "Logout" button, which is the unambiguous "authenticated" signal.
 */
export async function loginAsDevAdmin(page: Page) {
    await page.goto("/admin");

    const devLoginBtn = page.getByRole("button", { name: "Sign in with Dev Login" });
    await expect(devLoginBtn).toBeVisible();
    await devLoginBtn.click();

    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({
        timeout: 15_000,
    });
}
