import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { processImage } from "./image-processing";

describe("lib/image-processing", () => {
  async function createSmallJpeg(width: number, height: number): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  it("returns thumb, large, and original with correct shape", async () => {
    const input = await createSmallJpeg(100, 80);
    const result = await processImage(input);

    expect(result.thumb).toBeDefined();
    expect(result.thumb.buffer).toBeInstanceOf(Buffer);
    expect(result.thumb.buffer.length).toBeGreaterThan(0);
    expect(typeof result.thumb.width).toBe("number");
    expect(typeof result.thumb.height).toBe("number");

    expect(result.large).toBeDefined();
    expect(result.large.buffer).toBeInstanceOf(Buffer);
    expect(result.large.buffer.length).toBeGreaterThan(0);
    expect(result.large.width).toBe(100);
    expect(result.large.height).toBe(80);

    expect(result.original).toBeDefined();
    expect(result.original.buffer).toEqual(input);
    expect(result.original.contentType).toBe("image/jpeg");
    expect(result.original.width).toBe(100);
    expect(result.original.height).toBe(80);
  });

  it("thumb dimensions do not exceed 400px on long edge", async () => {
    const input = await createSmallJpeg(800, 600);
    const result = await processImage(input);

    expect(result.thumb.width).toBeLessThanOrEqual(400);
    expect(result.thumb.height).toBeLessThanOrEqual(400);
    expect(result.thumb.buffer.length).toBeGreaterThan(0);
  });

  it("large image is resized when over LARGE_IMAGE_MAX_MP cap", async () => {
    const orig = process.env.LARGE_IMAGE_MAX_MP;
    process.env.LARGE_IMAGE_MAX_MP = "0.0001";
    try {
      const input = await createSmallJpeg(200, 200);
      const result = await processImage(input);
      const maxDim = Math.floor(Math.sqrt(0.0001 * 1_000_000));
      expect(result.large.width).toBeLessThanOrEqual(maxDim);
      expect(result.large.height).toBeLessThanOrEqual(maxDim);
    } finally {
      process.env.LARGE_IMAGE_MAX_MP = orig;
    }
  });
});
