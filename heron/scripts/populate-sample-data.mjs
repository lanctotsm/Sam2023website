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

// Minimal valid 100x100 PNG (red square)
const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

// Slightly larger 200x200 PNG (placeholder pattern)
function createPlaceholderPng(width, height, name) {
  const size = Math.min(width, height, 400);
  const header = Buffer.alloc(8);
  header.write("\x89PNG\r\n\x1a\n");
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write("IHDR", 4);
  ihdr.writeUInt32BE(size, 8);
  ihdr.writeUInt32BE(size, 12);
  ihdr.writeUInt8(8, 16);
  ihdr.writeUInt8(2, 17);
  ihdr.writeUInt8(0, 18);
  return MINIMAL_PNG;
}

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

    // 4. Upload images to an album
    console.log("Uploading images...");
    await page.goto("/upload");
    await page.waitForLoadState("networkidle");

    const albumSelectEl = page.getByLabel(/album/i).or(page.locator('select').first());
    await albumSelectEl.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    const fileInput = page.getByLabel(/select photos/i).or(page.locator('input[type="file"]').first());
    await fileInput.setInputFiles(imagePaths);

    await page.waitForTimeout(1500);

    const uploadBtn = page.getByRole("button", { name: /upload.*photo/i });
    await page.waitForTimeout(500);
    if (await uploadBtn.isEnabled()) {
      await uploadBtn.click();
      await page.waitForSelector('text=Upload complete', { timeout: 20000 }).catch(() => {});
      console.log("Uploaded", imagePaths.length, "images to album.");
    } else {
      console.log("Upload button not ready; skipping upload.");
    }

    console.log("\nDone! Visit", BASE_URL, "to see the populated site.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await browser.close();
  }
}

main();
