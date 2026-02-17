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
vi.mock("@/services/post-albums", () => ({ getAlbumsForPost: vi.fn() }));
vi.mock("@/actions/posts", () => ({ linkAlbumToPost: vi.fn() }));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAlbumsForPost } = await import("@/services/post-albums");
const { linkAlbumToPost } = await import("@/actions/posts");

describe("GET /api/posts/[postID]/albums", () => {
  beforeEach(() => {
    vi.mocked(getAlbumsForPost).mockResolvedValue([]);
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
    expect(linkAlbumToPost).toHaveBeenCalledWith({ postId: 2, albumId: 3 });
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
