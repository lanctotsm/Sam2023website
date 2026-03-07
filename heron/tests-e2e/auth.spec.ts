import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should successfully sign in with Dev Login', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL(/.*\/admin/);

        // Click the Dev Login button
        const devLoginBtn = page.getByRole('button', { name: 'Sign in with Dev Login' });
        await expect(devLoginBtn).toBeVisible();
        await devLoginBtn.click();

        // Wait for redirect to admin posts or dashboard (depends on next-auth callback, typically /admin/posts)
        await page.waitForURL(/.*\/admin(?!.*login)/);

        // Verify we are inside the admin panel now (e.g. check for a specific heading or sign-out button)
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('text="Logout"').first()).toBeVisible();
    });
});
