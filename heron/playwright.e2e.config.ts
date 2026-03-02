import { defineConfig, devices } from "@playwright/test";

// Separate E2E test suite for manual invocation
// Requires the app and DB to be running: docker compose -f docker-compose.dev.yml up --build -d
// Run with: npm run test:e2e:suite

export default defineConfig({
    testDir: "./tests-e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    use: {
        baseURL: "http://localhost:3000",
        trace: "retain-on-failure",
        video: "retain-on-failure",
        screenshot: "only-on-failure",
        viewport: { width: 1280, height: 720 },
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
