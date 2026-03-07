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

    test('should load Resume page', async ({ page }) => {
        await page.goto('/resume');
        await expect(page.locator('body')).toBeVisible();
        // Just verify there is no Next.js standard 404 text
        await expect(page.locator('text="This page could not be found"')).toHaveCount(0);
    });

    test('api health or basic functionality', async ({ request }) => {
        const response = await request.get('/api/auth/providers');
        expect(response.ok()).toBeTruthy();
    });
});
