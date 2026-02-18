import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { jsonRequest, getRequest, getParams, MOCK_AUTH_USER } from "../../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  parseId: (v: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/posts", () => ({
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn()
}));
vi.mock("@/services/postInlineImages", () => ({
  getPostInlineImageIds: vi.fn(),
  replacePostInlineImages: vi.fn(),
  isImageReferencedByAnyPost: vi.fn()
}));
vi.mock("@/services/albumImages", () => ({
  isImageLinkedToAnyAlbum: vi.fn()
}));
vi.mock("@/services/images", () => ({
  getImageById: vi.fn(),
  deleteImage: vi.fn()
}));
vi.mock("@/lib/s3", () => ({
  deleteObjects: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializePost: (p: unknown) => p
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getPostById, updatePost, deletePost } = await import("@/services/posts");
const { getPostInlineImageIds, replacePostInlineImages, isImageReferencedByAnyPost } = await import("@/services/postInlineImages");
const { isImageLinkedToAnyAlbum } = await import("@/services/albumImages");
const { getImageById, deleteImage } = await import("@/services/images");
const { deleteObjects } = await import("@/lib/s3");

describe("POSTS /api/posts/[postID]", () => {
  const post = {
    id: 1,
    title: "Post",
    slug: "post",
    summary: "",
    markdown: "x",
    status: "published",
    publishedAt: null,
    createdBy: 1,
    createdAt: "",
    updatedAt: ""
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getPostById).mockResolvedValue(null);
    vi.mocked(getPostInlineImageIds).mockResolvedValue([]);
    vi.mocked(replacePostInlineImages).mockResolvedValue(undefined);
    vi.mocked(isImageReferencedByAnyPost).mockResolvedValue(false);
    vi.mocked(isImageLinkedToAnyAlbum).mockResolvedValue(false);
    vi.mocked(getImageById).mockResolvedValue(null);
    vi.mocked(deleteImage).mockResolvedValue(undefined);
    vi.mocked(deleteObjects).mockResolvedValue(undefined);
  });

  describe("GET (Read)", () => {
    it("returns 400 for invalid id", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ postID: "abc" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when post not found", async () => {
      vi.mocked(getPostById).mockResolvedValue(null);
      const res = await GET(getRequest("http://x"), { params: getParams({ postID: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 404 for draft when unauthenticated", async () => {
      vi.mocked(getPostById).mockResolvedValue({ ...post, status: "draft" } as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ postID: "1" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 and post when published and unauthenticated", async () => {
      vi.mocked(getPostById).mockResolvedValue(post as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ postID: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(1);
    });
  });

  describe("PUT (Update)", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "T", slug: "t", markdown: "m" }),
        { params: getParams({ postID: "1" }) }
      );
      expect(res.status).toBe(401);
      expect(updatePost).not.toHaveBeenCalled();
    });

    it("returns 400 when payload missing required fields", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "T", slug: "t" }),
        { params: getParams({ postID: "1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when updatePost returns null", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(updatePost).mockResolvedValue(null);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "T", slug: "t", markdown: "m" }),
        { params: getParams({ postID: "1" }) }
      );
      expect(res.status).toBe(404);
    });

    it("returns 200 and updated post when valid", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(updatePost).mockResolvedValue({ ...post, title: "Updated" } as never);
      vi.mocked(getPostInlineImageIds).mockResolvedValue([5, 6]);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "Updated", slug: "post", markdown: "m", inline_image_ids: [5, 6] }),
        { params: getParams({ postID: "1" }) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe("Updated");
      expect(updatePost).toHaveBeenCalledWith(1, expect.any(Object));
      expect(replacePostInlineImages).toHaveBeenCalledWith(1, [5, 6]);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await DELETE(getRequest("http://x"), { params: getParams({ postID: "1" }) });
      expect(res.status).toBe(401);
      expect(deletePost).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid id", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ postID: "0" }) });
      expect(res.status).toBe(400);
    });

    it("returns 200 and calls deletePost", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getPostInlineImageIds).mockResolvedValue([101]);
      vi.mocked(getImageById).mockResolvedValue({
        id: 101,
        s3Key: "uploads/a/large.jpg",
        s3KeyThumb: null,
        s3KeyLarge: "uploads/a/large.jpg",
        s3KeyOriginal: "uploads/a/original.jpg"
      } as never);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ postID: "1" }) });
      expect(res.status).toBe(200);
      expect(deletePost).toHaveBeenCalledWith(1);
      expect(deleteObjects).toHaveBeenCalled();
      expect(deleteImage).toHaveBeenCalledWith(101);
      const data = await res.json();
      expect(data.status).toBe("deleted");
    });

    it("does not delete any image when post has no owned image refs", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getPostInlineImageIds).mockResolvedValue([]);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ postID: "1" }) });
      expect(res.status).toBe(200);
      expect(deleteImage).not.toHaveBeenCalled();
      expect(deleteObjects).not.toHaveBeenCalled();
    });

    it("keeps image when referenced by album", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getPostInlineImageIds).mockResolvedValue([101]);
      vi.mocked(isImageLinkedToAnyAlbum).mockResolvedValue(true);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ postID: "1" }) });
      expect(res.status).toBe(200);
      expect(deleteImage).not.toHaveBeenCalled();
      expect(deleteObjects).not.toHaveBeenCalled();
    });
  });
});
