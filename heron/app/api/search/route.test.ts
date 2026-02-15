import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/services/search", () => ({
  searchFts: vi.fn()
}));

const { searchFts } = await import("@/services/search");

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.mocked(searchFts).mockResolvedValue({ posts: [], albums: [] });
  });

  it("returns 200 and empty results when q is empty", async () => {
    const res = await GET(new Request("http://localhost:3000/api/search"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ posts: [], albums: [] });
    expect(searchFts).toHaveBeenCalledWith("");
  });

  it("returns 200 and results when q provided", async () => {
    const posts = [{ id: 1, title: "Hit", slug: "hit", summary: "", markdown: "", status: "published", published_at: null, created_by: 1, created_at: "", updated_at: "" }];
    vi.mocked(searchFts).mockResolvedValue({ posts, albums: [] });
    const res = await GET(new Request("http://localhost:3000/api/search?q=test"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts).toHaveLength(1);
    expect(data.posts[0].title).toBe("Hit");
    expect(searchFts).toHaveBeenCalledWith("test");
  });
});
