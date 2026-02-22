import { describe, it, expect } from "vitest";
import { serializePost, serializeAlbum, serializeImage } from "./serializers";

describe("lib/serializers", () => {
  describe("serializePost", () => {
    it("maps post row to API shape", () => {
      const row = {
        id: 1,
        title: "My Post",
        slug: "my-post",
        summary: "Summary",
        markdown: "# Hi",
        status: "published" as const,
        publishedAt: "2024-01-15T00:00:00Z",
        metadata: null,
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z"
      };
      expect(serializePost(row)).toEqual({
        id: 1,
        title: "My Post",
        slug: "my-post",
        summary: "Summary",
        markdown: "# Hi",
        status: "published",
        published_at: "2024-01-15T00:00:00Z",
        metadata: null,
        created_by: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z"
      });
    });

    it("uses empty string for null summary and normalizes null dates", () => {
      const row = {
        id: 2,
        title: "Draft",
        slug: "draft",
        summary: null,
        markdown: "",
        status: "draft" as const,
        publishedAt: null,
        metadata: null,
        createdBy: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      };
      const out = serializePost(row);
      expect(out.summary).toBe("");
      expect(out.published_at).toBeNull();
      expect(out.metadata).toBeNull();
      expect(out.created_by).toBeNull();
    });

    it("serializes populated metadata", () => {
      const row = {
        id: 3,
        title: "Meta Post",
        slug: "meta-post",
        summary: "Sum",
        markdown: "MD",
        status: "published" as const,
        publishedAt: "2024-01-01T00:00:00Z",
        metadata: { seo_title: "SEO", og_image: "img.jpg" },
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      };
      const out = serializePost(row);
      expect(out.metadata).toEqual({ seo_title: "SEO", og_image: "img.jpg" });
    });

    it("includes inline_image_ids when provided in options", () => {
      const row = {
        id: 4,
        title: "Inline Post",
        slug: "inline-post",
        summary: "",
        markdown: "",
        status: "published" as const,
        publishedAt: null,
        metadata: null,
        createdBy: null,
        createdAt: "",
        updatedAt: ""
      };
      const out = serializePost(row, { inlineImageIds: [10, 20] });
      expect(out).toHaveProperty("inline_image_ids", [10, 20]);
    });
  });

  describe("serializeAlbum", () => {
    it("maps album row to API shape", () => {
      const row = {
        id: 1,
        title: "Trip",
        slug: "trip",
        description: "A trip",
        coverImageS3Key: "uploads/uuid/thumb.jpg",
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      };
      expect(serializeAlbum(row)).toEqual({
        id: 1,
        title: "Trip",
        slug: "trip",
        description: "A trip",
        cover_image_s3_key: "uploads/uuid/thumb.jpg",
        created_by: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      });
    });

    it("uses empty string for null description", () => {
      const row = {
        id: 2,
        title: "Empty",
        slug: "empty",
        description: null,
        coverImageS3Key: undefined,
        createdBy: null,
        createdAt: "",
        updatedAt: ""
      };
      const out = serializeAlbum(row);
      expect(out.description).toBe("");
      expect(out.cover_image_s3_key).toBeNull();
    });

    it("returns null cover_image_s3_key when album has no images", () => {
      const row = {
        id: 3,
        title: "No Images",
        slug: "no-images",
        description: null,
        coverImageS3Key: null,
        createdBy: null,
        createdAt: "",
        updatedAt: ""
      };
      expect(serializeAlbum(row).cover_image_s3_key).toBeNull();
    });
  });

  describe("serializeImage", () => {
    it("maps image row to API shape with variant keys", () => {
      const row = {
        id: 1,
        s3Key: "uploads/uuid/large.jpg",
        s3KeyThumb: "uploads/uuid/thumb.jpg",
        s3KeyLarge: "uploads/uuid/large.jpg",
        s3KeyOriginal: "uploads/uuid/original.jpg",
        width: 800,
        height: 600,
        caption: "A photo",
        altText: "Alt",
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00Z"
      };
      expect(serializeImage(row)).toEqual({
        id: 1,
        s3_key: "uploads/uuid/large.jpg",
        s3_key_thumb: "uploads/uuid/thumb.jpg",
        s3_key_large: "uploads/uuid/large.jpg",
        s3_key_original: "uploads/uuid/original.jpg",
        width: 800,
        height: 600,
        name: "",
        caption: "A photo",
        alt_text: "Alt",
        description: "",
        tags: "",
        created_by: 1,
        created_at: "2024-01-01T00:00:00Z"
      });
    });

    it("uses null for optional variant keys and empty strings for caption/alt/name/description/tags", () => {
      const row = {
        id: 2,
        s3Key: "legacy/key.jpg",
        s3KeyThumb: null,
        s3KeyLarge: null,
        s3KeyOriginal: null,
        width: null,
        height: null,
        name: null,
        caption: null,
        altText: null,
        description: null,
        tags: null,
        createdBy: null,
        createdAt: ""
      };
      const out = serializeImage(row);
      expect(out.s3_key_thumb).toBeNull();
      expect(out.s3_key_large).toBeNull();
      expect(out.s3_key_original).toBeNull();
      expect(out.caption).toBe("");
      expect(out.alt_text).toBe("");
      expect(out.name).toBe("");
      expect(out.description).toBe("");
      expect(out.tags).toBe("");
    });
  });
});
