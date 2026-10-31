import { test, expect } from "@playwright/test";
import { loginAsDevAdmin } from "./helpers/auth";

const GOOGLE_LOGO_SRC =
    "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";
// A real file on the same host. A host-wide img-src allow would load it.
const OTHER_GSTATIC_IMAGE =
    "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg";

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

    test("google sign-in shows the official logo and accepts the sign-in request", async ({ page }) => {
        const response = await page.goto("/admin");
        const csp = response?.headers()["content-security-policy"] ?? "";
        const imgSrc = csp
            .split(";")
            .map((part) => part.trim())
            .find((part) => part.startsWith("img-src"));
        const gstaticSources = (imgSrc ?? "")
            .replace(/^img-src\s*/, "")
            .split(/\s+/)
            .filter((source) => source.includes("gstatic.com"));
        expect(gstaticSources).toEqual([GOOGLE_LOGO_SRC]);

        const button = page.getByRole("button", { name: "Sign in with Google" });
        await expect(button).toBeVisible();
        const logo = button.locator("img");
        await expect(logo).toHaveAttribute("src", GOOGLE_LOGO_SRC);
        await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

        const otherImageBlocked = await page.evaluate((src) => {
            return new Promise<boolean>((resolve) => {
                const img = new Image();
                const timer = window.setTimeout(() => resolve(true), 10_000);
                img.onload = () => {
                    window.clearTimeout(timer);
                    resolve(false);
                };
                img.onerror = () => {
                    window.clearTimeout(timer);
                    resolve(true);
                };
                img.src = src;
            });
        }, OTHER_GSTATIC_IMAGE);
        expect(otherImageBlocked).toBe(true);

        // Read the body here. The click follows Auth.js's redirect and Playwright
        // then drops the original response body.
        let signInStatus = 0;
        let signInBody = "";
        await page.route("**/api/auth/signin/google", async (route) => {
            const upstream = await route.fetch();
            signInStatus = upstream.status();
            signInBody = await upstream.text();
            await route.fulfill({ response: upstream, body: signInBody });
        });
        await button.click();
        await expect.poll(() => signInBody.length).toBeGreaterThan(0);
        expect(signInStatus).toBe(200);
        const body = JSON.parse(signInBody) as { url?: string; error?: string };
        expect(body.error).toBeUndefined();
        expect(body.url).toBeTruthy();
    });

    test("settings page requires authentication", async ({ page }) => {
        await page.goto("/admin/settings");
        await expect(page.getByRole("button", { name: "Sign in with Dev Login" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Admin Settings" })).toHaveCount(0);
    });
});
