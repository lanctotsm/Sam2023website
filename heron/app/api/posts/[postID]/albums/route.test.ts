import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { jsonRequest, getParams, MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  parseId: (v: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  errorResponse: (msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/lib/serializers", () => ({ serializeAlbum: (a: unknown) => a }));
vi.mock("@/services/post-albums", () => ({ getAlbumsForPost: vi.fn(), linkAlbumToPost: vi.fn() }));
vi.mock("@/services/posts", () => ({ getPostById: vi.fn() }));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAlbumsForPost, linkAlbumToPost } = await import("@/services/post-albums");
const { getPostById } = await import("@/services/posts");

const publishedPost = {
  id: 5,
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

describe("GET /api/posts/[postID]/albums", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAlbumsForPost).mockResolvedValue([]);
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getPostById).mockResolvedValue(publishedPost as never);
  });

  it("returns 400 for invalid post id", async () => {
    const res = await GET(new Request("http://x"), { params: getParams({ postID: "abc" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("invalid post id");
  });

  it("returns 200 with albums for valid post id", async () => {
    const albums = [
      { id: 1, title: "A", slug: "a", description: "", createdBy: 1, createdAt: "", updatedAt: "" }
    ];
    vi.mocked(getAlbumsForPost).mockResolvedValue(albums as never);
    const res = await GET(new Request("http://x"), { params: getParams({ postID: "5" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(getAlbumsForPost).toHaveBeenCalledWith(5);
  });

  it("returns 404 for a published post scheduled in the future when unauthenticated", async () => {
    vi.mocked(getPostById).mockResolvedValue({
      ...publishedPost,
      publishedAt: "2099-01-01T00:00:00.000Z"
    } as never);
    vi.mocked(getAlbumsForPost).mockResolvedValue([
      { id: 1, title: "Secret album", slug: "secret", description: "", createdBy: 1, createdAt: "", updatedAt: "" }
    ] as never);

    const res = await GET(new Request("http://x"), { params: getParams({ postID: "5" }) });
    expect(res.status).toBe(404);
    expect(getAlbumsForPost).not.toHaveBeenCalled();
  });

  it("returns 200 for a published post scheduled in the future when authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getPostById).mockResolvedValue({
      ...publishedPost,
      publishedAt: "2099-01-01T00:00:00.000Z"
    } as never);
    const albums = [
      { id: 1, title: "A", slug: "a", description: "", createdBy: 1, createdAt: "", updatedAt: "" }
    ];
    vi.mocked(getAlbumsForPost).mockResolvedValue(albums as never);

    const res = await GET(new Request("http://x"), { params: getParams({ postID: "5" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
  });

  it("returns 404 when the post does not exist", async () => {
    vi.mocked(getPostById).mockResolvedValue(null);

    const res = await GET(new Request("http://x"), { params: getParams({ postID: "5" }) });
    expect(res.status).toBe(404);
    expect(getAlbumsForPost).not.toHaveBeenCalled();
  });
});

describe("POST /api/posts/[postID]/albums", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(linkAlbumToPost).mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await POST(
      jsonRequest("POST", "http://x", { album_id: 1 }),
      { params: getParams({ postID: "1" }) }
    );
    expect(res.status).toBe(401);
    expect(linkAlbumToPost).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid post id", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(
      jsonRequest("POST", "http://x", { album_id: 1 }),
      { params: getParams({ postID: "x" }) }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when album_id is missing or invalid", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res1 = await POST(
      jsonRequest("POST", "http://x", {}),
      { params: getParams({ postID: "1" }) }
    );
    expect(res1.status).toBe(400);
    const res2 = await POST(
      jsonRequest("POST", "http://x", { album_id: 0 }),
      { params: getParams({ postID: "1" }) }
    );
    expect(res2.status).toBe(400);
  });

  it("returns 200 when album linked", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(
      jsonRequest("POST", "http://x", { album_id: 3 }),
      { params: getParams({ postID: "2" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("linked");
    expect(linkAlbumToPost).toHaveBeenCalledWith(2, 3);
  });

  it("returns 400 when linkAlbumToPost throws", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(linkAlbumToPost).mockRejectedValue(new Error("already linked"));
    const res = await POST(
      jsonRequest("POST", "http://x", { album_id: 1 }),
      { params: getParams({ postID: "1" }) }
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("already linked");
  });
});
