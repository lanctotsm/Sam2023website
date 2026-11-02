import { afterEach, describe, expect, it, vi } from "vitest";

async function loadLimits() {
  vi.resetModules();
  return import("./upload-limits");
}

describe("upload-limits", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to 25MB", async () => {
    vi.stubEnv("MAX_UPLOAD_BYTES", "");
    vi.stubEnv("NEXT_PUBLIC_MAX_UPLOAD_BYTES", "");
    const { MAX_UPLOAD_BYTES, DEFAULT_MAX_UPLOAD_BYTES } = await loadLimits();
    expect(MAX_UPLOAD_BYTES).toBe(DEFAULT_MAX_UPLOAD_BYTES);
    expect(MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
  });

  it("prefers MAX_UPLOAD_BYTES over the public mirror", async () => {
    vi.stubEnv("MAX_UPLOAD_BYTES", "1000");
    vi.stubEnv("NEXT_PUBLIC_MAX_UPLOAD_BYTES", "2000");
    expect((await loadLimits()).MAX_UPLOAD_BYTES).toBe(1000);
  });

  it("falls back to NEXT_PUBLIC_MAX_UPLOAD_BYTES", async () => {
    vi.stubEnv("MAX_UPLOAD_BYTES", "");
    vi.stubEnv("NEXT_PUBLIC_MAX_UPLOAD_BYTES", "2000");
    expect((await loadLimits()).MAX_UPLOAD_BYTES).toBe(2000);
  });

  it("ignores invalid or non-positive values", async () => {
    vi.stubEnv("MAX_UPLOAD_BYTES", "-5");
    vi.stubEnv("NEXT_PUBLIC_MAX_UPLOAD_BYTES", "abc");
    expect((await loadLimits()).MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
  });

  it("accepts common image types only", async () => {
    const { ALLOWED_IMAGE_TYPES } = await loadLimits();
    expect(ALLOWED_IMAGE_TYPES.test("image/webp")).toBe(true);
    expect(ALLOWED_IMAGE_TYPES.test("image/svg+xml")).toBe(false);
  });
});
