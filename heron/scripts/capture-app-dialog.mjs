/**
 * One-off visual capture of AppDialog for PR review.
 * Usage: node scripts/capture-app-dialog.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/screenshots");
const outFile = path.join(outDir, "app-dialog-confirm.png");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>AppDialog preview</title>
    <style>
      :root {
        --chestnut: #480903;
        --chestnut-dark: #2a0502;
        --olive: #7d6820;
        --desert-tan: #e5d1a4;
        --desert-tan-dark: #d9c69a;
        --copper: #b64b12;
        --surface: #fbf6ec;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Segoe UI", Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top left, rgba(229, 209, 164, 0.55), transparent 45%),
          linear-gradient(160deg, #fbf6ec 0%, #f0e4c8 55%, #e5d1a4 100%);
        color: var(--chestnut);
      }
      .page {
        padding: 48px;
      }
      .page h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      .page p {
        margin: 0;
        color: var(--olive);
        max-width: 42rem;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }
      .dialog {
        width: 100%;
        max-width: 28rem;
        border-radius: 1rem;
        border: 1px solid var(--desert-tan-dark);
        background: #fff;
        padding: 24px;
        box-shadow: 0 25px 50px -12px rgba(72, 9, 3, 0.35);
      }
      .dialog h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--chestnut);
      }
      .dialog p {
        margin: 12px 0 0;
        font-size: 0.875rem;
        line-height: 1.6;
        color: var(--olive);
        white-space: pre-wrap;
      }
      .actions {
        margin-top: 24px;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }
      button {
        border-radius: 0.5rem;
        padding: 10px 16px;
        font: inherit;
        font-size: 0.95rem;
        cursor: pointer;
      }
      .cancel {
        border: 1px solid var(--chestnut);
        background: transparent;
        color: var(--chestnut);
      }
      .danger {
        border: none;
        background: var(--copper);
        color: #fff;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>Albums</h1>
      <p>Admin list behind the modal, matching the branded confirm surface used in Heron.</p>
    </div>
    <div class="backdrop" role="presentation">
      <div
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
      >
        <h2 id="dialog-title">Delete album</h2>
        <p id="dialog-desc">Are you sure you want to delete this album?</p>
        <div class="actions">
          <button type="button" class="cancel">Cancel</button>
          <button type="button" class="danger">Delete</button>
        </div>
      </div>
    </div>
  </body>
</html>`;

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.locator('[role="alertdialog"]').waitFor();
await page.screenshot({ path: outFile, type: "png" });
await browser.close();

await writeFile(
  path.join(outDir, "README.md"),
  [
    "# Screenshots",
    "",
    "Generated assets for PR review. `app-dialog-confirm.png` was captured with Playwright (`heron/scripts/capture-app-dialog.mjs`).",
    ""
  ].join("\n")
);

console.log(`Wrote ${outFile}`);
