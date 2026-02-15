import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getRequest, getParams, MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/posts", () => ({
  getPostBySlug: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializePost: (p: unknown) => p
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getPostBySlug } = await import("@/services/posts");

describe("POSTS /api/posts/slug/[slug]", () => {
  const post = {
    id: 1,
    title: "Post",
    slug: "my-post",
    summary: "",
    markdown: "x",
    status: "published",
    publishedAt: null,
    createdBy: 1,
    createdAt: "",
    updatedAt: ""
  };

  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getPostBySlug).mockResolvedValue(null);
  });

  describe("GET (Read by slug)", () => {
    it("returns 400 when slug missing", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when post not found", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "nonexistent" }) });
      expect(res.status).toBe(404);
    });

    it("returns 404 for draft when unauthenticated", async () => {
      vi.mocked(getPostBySlug).mockResolvedValue({ ...post, status: "draft" } as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "my-post" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 and post when published", async () => {
      vi.mocked(getPostBySlug).mockResolvedValue(post as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "my-post" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.slug).toBe("my-post");
    });

    it("returns 200 for draft when authenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getPostBySlug).mockResolvedValue({ ...post, status: "draft" } as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "my-post" }) });
      expect(res.status).toBe(200);
    });
  });
});
