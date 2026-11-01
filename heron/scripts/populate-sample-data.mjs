#!/usr/bin/env node
/**
 * Populate the site with sample albums, images, and blog posts using Playwright (Firefox).
 * Run: node scripts/populate-sample-data.mjs
 * Requires: Docker dev stack running at localhost:3000
 */

import { firefox } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SAMPLES_DIR = join(process.cwd(), ".samples");

// Minimal valid PNG (1x1 red square)
const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function ensureSamplesDir() {
  if (!existsSync(SAMPLES_DIR)) {
    mkdirSync(SAMPLES_DIR, { recursive: true });
  }
  const paths = [];
  for (let i = 1; i <= 5; i++) {
    const p = join(SAMPLES_DIR, `sample-${i}.png`);
    writeFileSync(p, MINIMAL_PNG);
    paths.push(p);
  }
  return paths;
}

const SAMPLE_POSTS = [
  {
    title: "Getting Started with Next.js",
    slug: "getting-started-nextjs",
    summary: "A quick dive into building modern web apps with the React framework.",
    markdown: `# Getting Started with Next.js

Next.js has become one of the most popular frameworks for building React applications. Here's why:

- **Server-side rendering** out of the box
- **File-based routing** that just works
- **API routes** for backend logic
- **Optimized images** and static assets

## First Steps

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

That's it! Your app is running. From here, explore the \`app\` directory and start building.`,
    status: "published",
  },
  {
    title: "Weekend Adventures in the Blue Ridge",
    slug: "weekend-blue-ridge",
    summary: "A few days of hiking, photography, and fresh mountain air.",
    markdown: `# Weekend in the Blue Ridge

Last weekend we drove out to the Blue Ridge Mountains for a quick escape from the city.

## Day One

We arrived Friday evening and set up camp. The stars were incredible—no light pollution for miles.

## Day Two

Morning hike to a ridge overlook. Saw a black bear in the distance (respectful distance, of course). The fall colors were just starting to turn.

## Day Three

Packed up and drove home, stopping at a few overlooks for photos. Already planning the next trip.`,
    status: "published",
  },
  {
    title: "Thoughts on Photography and Technology",
    slug: "photography-and-tech",
    summary: "How tools shape the way we capture and share moments.",
    markdown: `# Photography and Technology

The intersection of photography and tech has always fascinated me. From film to digital to computational photography—each shift changes not just how we take pictures, but *what* we photograph.

## The Joy of Constraints

Sometimes the best tool is the one in your pocket. Phone cameras force you to work with what you have, and that constraint can spark creativity.

## Processing Pipeline

Sharp, Lightroom, or even in-camera—the processing step is where a lot of the magic happens. Understanding the pipeline helps you make better decisions in the field.`,
    status: "published",
  },
];

async function main() {
  const imagePaths = ensureSamplesDir();
  console.log("Sample images ready:", imagePaths.length);

  const browser = await firefox.launch({
    headless: true,
  });

  const context = await browser.newContext({
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Handle Dev Login prompt (window.prompt for email)
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "prompt") {
      await dialog.accept("dev@local");
    } else {
      await dialog.dismiss();
    }
  });

  try {
    // 1. Log in
    console.log("Logging in...");
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const devLoginBtn = page.getByRole("button", { name: /dev login/i });
    if (await devLoginBtn.isVisible()) {
      await devLoginBtn.click();
      await page.waitForTimeout(2000);
    } else {
      console.log("Already logged in or Dev Login not found.");
    }

    await page.waitForTimeout(1000);

    // 2. Create albums
    console.log("Creating albums...");
    await page.goto("/admin/albums");
    await page.waitForLoadState("networkidle");

    const albumsToCreate = [
      { title: "Sample Album", slug: "sample-album", description: "Starter album for local testing." },
      { title: "Nature Shots", slug: "nature-shots", description: "Outdoor and landscape photography." },
      { title: "Portraits", slug: "portraits", description: "People and candid moments." },
    ];
    for (const a of albumsToCreate) {
      await page.getByPlaceholder("Album title").fill(a.title);
      await page.getByPlaceholder("album-url-slug").fill(a.slug);
      await page.getByPlaceholder(/description/i).fill(a.description);
      await page.getByRole("button", { name: /create album/i }).click();
      await page.waitForTimeout(800);
      console.log("Created album:", a.title);
    }

    // 3. Create posts
    console.log("Creating posts...");
    await page.goto("/admin/posts");
    await page.waitForLoadState("networkidle");

    for (const post of SAMPLE_POSTS) {
      await page.getByPlaceholder("Post title").fill(post.title);
      await page.getByPlaceholder("post-url-slug").fill(post.slug);
      await page.getByPlaceholder(/summary/i).fill(post.summary);
      await page.getByPlaceholder(/markdown/i).fill(post.markdown);
      await page.locator('select').last().selectOption(post.status);
      await page.getByRole("button", { name: /create post/i }).click();
      await page.waitForTimeout(800);
      console.log("Created post:", post.title);
    }

    // 4. Upload images through the album editor
    console.log("Uploading images...");
    await page.goto("/admin/albums");
    await page.waitForLoadState("networkidle");

    const sampleAlbum = page.locator("article").filter({ hasText: "Sample Album" });
    await sampleAlbum.getByRole("link", { name: /manage/i }).click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("heading", { name: /add photos/i }).click();
    const fileInput = page.getByLabel(/select photos or zip file/i);
    await fileInput.setInputFiles(imagePaths);

    const uploadBtn = page.getByRole("button", { name: /upload \d+ photo/i });
    const buttonReady = await uploadBtn
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (buttonReady) {
      const UPLOAD_TIMEOUT_MS = 60000;
      let succeededUploads = 0;
      const failedUploads = [];
      page.on("response", (res) => {
        if (!res.url().includes("/api/images/upload") || res.request().method() !== "POST") {
          return;
        }
        if (res.ok()) {
          succeededUploads += 1;
        } else {
          failedUploads.push(res.status());
        }
      });
      await uploadBtn.click();
      const deadline = Date.now() + UPLOAD_TIMEOUT_MS;
      while (
        succeededUploads + failedUploads.length < imagePaths.length &&
        Date.now() < deadline
      ) {
        await page.waitForTimeout(250);
      }
      if (failedUploads.length > 0) {
        throw new Error(
          `${failedUploads.length} upload(s) failed (HTTP ${failedUploads.join(", ")}); ` +
            `${succeededUploads}/${imagePaths.length} succeeded.`
        );
      }
      if (succeededUploads < imagePaths.length) {
        throw new Error(
          `Timed out after ${UPLOAD_TIMEOUT_MS / 1000}s: ` +
            `${succeededUploads}/${imagePaths.length} uploads completed.`
        );
      }
      console.log("Uploaded", succeededUploads, "images to album.");
    } else {
      console.log("Upload button not ready; skipping upload.");
    }

    console.log("\nDone! Visit", BASE_URL, "to see the populated site.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
