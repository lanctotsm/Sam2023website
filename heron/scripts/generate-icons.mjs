/**
 * Regenerates the binary icons in public/ from public/icon.svg.
 *
 *   node scripts/generate-icons.mjs
 *
 * favicon.ico holds 16, 32 and 48px PNGs and keeps the rounded transparent corners.
 * apple-touch-icon.png is a full-bleed square flattened onto the brand colour,
 * because iOS rounds the corners itself and shows transparency as black.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BRAND_COLOUR = "#480903";
const ICO_SIZES = [16, 32, 48];
const APPLE_TOUCH_SIZE = 180;
const SVG_VIEWBOX_SIZE = 64;
// librsvg rasterises SVGs at 72 dpi unless told otherwise.
const SVG_BASE_DPI = 72;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(scriptDir, "..", "public");
const sourcePath = path.join(publicDir, "icon.svg");

function squareVariant(svg) {
  const squared = svg.replace(/(<rect\b[^>]*?)\s+rx="[^"]*"/, "$1");
  if (squared === svg) {
    throw new Error("icon.svg has no rounded rect to square off for the touch icon");
  }
  return squared;
}

async function renderPng(svg, size, { flattenTo } = {}) {
  let pipeline = sharp(Buffer.from(svg), {
    density: (SVG_BASE_DPI * size) / SVG_VIEWBOX_SIZE
  }).resize(size, size);

  if (flattenTo) {
    pipeline = pipeline.flatten({ background: flattenTo }).removeAlpha();
  }

  return pipeline.png().toBuffer();
}

/** Builds an ICO file that stores each PNG as-is (Vista+ format). */
function buildIco(images) {
  const headerSize = 6;
  const entrySize = 16;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(entrySize * images.length);
  let offset = headerSize + directory.length;

  images.forEach(({ size, png }, index) => {
    const entry = index * entrySize;
    directory.writeUInt8(size, entry); // width
    directory.writeUInt8(size, entry + 1); // height
    directory.writeUInt8(0, entry + 2); // colour count (0 for 32bpp)
    directory.writeUInt8(0, entry + 3); // reserved
    directory.writeUInt16LE(1, entry + 4); // colour planes
    directory.writeUInt16LE(32, entry + 6); // bits per pixel
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });

  return Buffer.concat([header, directory, ...images.map((image) => image.png)]);
}

async function main() {
  const svg = await readFile(sourcePath, "utf8");

  const icoImages = [];
  for (const size of ICO_SIZES) {
    icoImages.push({ size, png: await renderPng(svg, size) });
  }
  const icoPath = path.join(publicDir, "favicon.ico");
  await writeFile(icoPath, buildIco(icoImages));
  console.log(`Wrote ${icoPath}`);

  const applePng = await renderPng(squareVariant(svg), APPLE_TOUCH_SIZE, {
    flattenTo: BRAND_COLOUR
  });
  const applePath = path.join(publicDir, "apple-touch-icon.png");
  await writeFile(applePath, applePng);
  console.log(`Wrote ${applePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
