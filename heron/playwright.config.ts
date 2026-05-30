import { defineConfig, devices } from "@playwright/test";

// `npm run test:e2e` now ensures MinIO/local DB deps and starts/reuses the app.

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
