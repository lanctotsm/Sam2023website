import { describe, it, expect, afterEach } from "vitest";
import { buildImageUrl, buildThumbUrl, buildLargeUrl, buildOriginalUrl } from "./images";

describe("lib/images", () => {
  const originalEnv = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL = originalEnv;
  });

  describe("buildImageUrl", () => {
    it("returns key as-is when NEXT_PUBLIC_IMAGE_BASE_URL is not set", () => {
      delete process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
      expect(buildImageUrl("uploads/abc/thumb.jpg")).toBe("uploads/abc/thumb.jpg");
    });

    it("returns key as-is when base is empty string", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "";
      expect(buildImageUrl("uploads/abc/thumb.jpg")).toBe("uploads/abc/thumb.jpg");
    });

    it("prepends base URL and normalizes slashes", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildImageUrl("uploads/abc/thumb.jpg")).toBe("https://cdn.example.com/uploads/abc/thumb.jpg");
    });

    it("strips trailing slash from base", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com/";
      expect(buildImageUrl("uploads/x.jpg")).toBe("https://cdn.example.com/uploads/x.jpg");
    });

    it("strips leading slash from key", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildImageUrl("/uploads/x.jpg")).toBe("https://cdn.example.com/uploads/x.jpg");
    });
  });

  describe("buildThumbUrl", () => {
    it("uses s3_key_thumb when set", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildThumbUrl({ s3_key: "k", s3_key_thumb: "thumb.jpg" })).toBe("https://cdn.example.com/thumb.jpg");
    });

    it("falls back to s3_key when s3_key_thumb is null", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildThumbUrl({ s3_key: "uploads/orig.jpg", s3_key_thumb: null })).toBe("https://cdn.example.com/uploads/orig.jpg");
    });

    it("falls back to s3_key when s3_key_thumb is undefined", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildThumbUrl({ s3_key: "uploads/orig.jpg" })).toBe("https://cdn.example.com/uploads/orig.jpg");
    });
  });

  describe("buildLargeUrl", () => {
    it("uses s3_key_large when set", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildLargeUrl({ s3_key: "k", s3_key_large: "large.jpg" })).toBe("https://cdn.example.com/large.jpg");
    });

    it("falls back to s3_key when s3_key_large is null", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildLargeUrl({ s3_key: "uploads/orig.jpg", s3_key_large: null })).toBe("https://cdn.example.com/uploads/orig.jpg");
    });
  });

  describe("buildOriginalUrl", () => {
    it("uses s3_key_original when set", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildOriginalUrl({ s3_key: "k", s3_key_original: "original.png" })).toBe("https://cdn.example.com/original.png");
    });

    it("falls back to s3_key when s3_key_original is undefined", () => {
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";
      expect(buildOriginalUrl({ s3_key: "uploads/orig.jpg" })).toBe("https://cdn.example.com/uploads/orig.jpg");
    });
  });
});
