import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { jsonRequest, getRequest, MOCK_AUTH_USER } from "../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/posts", () => ({
  getAllPosts: vi.fn(),
  createPost: vi.fn()
}));
vi.mock("@/services/postInlineImages", () => ({
  replacePostInlineImages: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializePost: (p: unknown) => p
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAllPosts, createPost } = await import("@/services/posts");
const { replacePostInlineImages } = await import("@/services/postInlineImages");

describe("POSTS /api/posts", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getAllPosts).mockResolvedValue([]);
    vi.mocked(replacePostInlineImages).mockResolvedValue(undefined);
  });

  describe("GET", () => {
    it("returns 200 and list of posts", async () => {
      const posts = [
        { id: 1, title: "A", slug: "a", summary: "", markdown: "x", status: "published", publishedAt: null, createdBy: 1, createdAt: "", updatedAt: "" }
      ];
      vi.mocked(getAllPosts).mockResolvedValue(posts as never);

      const res = await GET(getRequest("http://localhost:3000/api/posts"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe("A");
    });

    it("passes status filter when provided", async () => {
      vi.mocked(getAllPosts).mockResolvedValue([] as never);
      await GET(getRequest("http://localhost:3000/api/posts?status=draft"));
      expect(getAllPosts).toHaveBeenCalledWith(expect.objectContaining({ status: "draft" }));
    });
  });

  describe("POST (Create)", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(null);
      const res = await POST(
        jsonRequest("POST", "http://localhost:3000/api/posts", {
          title: "Test",
          slug: "test",
          markdown: "body"
        })
      );
      expect(res.status).toBe(401);
      expect(createPost).not.toHaveBeenCalled();
    });

    it("returns 400 when title, slug, or markdown missing", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await POST(
        jsonRequest("POST", "http://localhost:3000/api/posts", {
          title: "Test",
          slug: ""
        })
      );
      expect(res.status).toBe(400);
      expect(createPost).not.toHaveBeenCalled();
    });

    it("returns 201 and created post when valid", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const created = {
        id: 1,
        title: "New Post",
        slug: "new-post",
        summary: "S",
        markdown: "M",
        status: "draft",
        publishedAt: null,
        createdBy: 1,
        createdAt: "",
        updatedAt: ""
      };
      vi.mocked(createPost).mockResolvedValue(created as never);

      const res = await POST(
        jsonRequest("POST", "http://localhost:3000/api/posts", {
          title: "New Post",
          slug: "new-post",
          summary: "S",
          markdown: "M",
          inline_image_ids: [101, 102]
        })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.title).toBe("New Post");
      expect(createPost).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New Post", slug: "new-post", markdown: "M", createdBy: 1 })
      );
      expect(replacePostInlineImages).toHaveBeenCalledWith(1, [101, 102]);
    });
  });
});
