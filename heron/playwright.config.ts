import { defineConfig, devices } from "@playwright/test";

// Playwright manages the app lifecycle via `webServer` below:
// - CI: builds happen as an explicit workflow step, then `next start` is launched here.
// - Local: `next dev` is launched (and an already-running dev server is reused).
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Specs share one SQLite file, one dev server, and mutable global settings
  // (admin-settings.spec.ts rewrites site_title, which basic.spec.ts asserts on),
  // so they must not run concurrently.
  workers: 1,
  reporter: isCI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: isCI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
