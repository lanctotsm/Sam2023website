import { test, expect } from '@playwright/test';

test.describe('Comprehensive Routing', () => {
    test('should load Home page successfully and check basics', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/.+/);
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();
    });

    test('should load Posts index page', async ({ page }) => {
        await page.goto('/posts');
        await expect(page.locator('h1').first()).toContainText(/posts/i);
    });

    test('should load Albums index page', async ({ page }) => {
        await page.goto('/albums');
        await expect(page.locator('h1').first()).toContainText(/albums/i);
    });

    test('should load Resume page with the empty-state placeholder', async ({ page }) => {
        await page.goto('/resume');
        await expect(page).toHaveURL(/\/resume/);
        await expect(page.getByRole("heading", { name: /Resume coming soon/i })).toBeVisible();
    });

    test('api health or basic functionality', async ({ request }) => {
        const response = await request.get('/api/auth/providers');
        expect(response.ok()).toBeTruthy();
    });
});
