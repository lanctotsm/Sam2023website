import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getRequest, getParams } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/albums", () => ({
  getAlbumBySlug: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializeAlbum: (a: unknown) => a
}));

const { getAlbumBySlug } = await import("@/services/albums");

describe("ALBUMS /api/albums/slug/[slug]", () => {
  const album = {
    id: 1,
    title: "Album",
    slug: "my-album",
    description: "D",
    createdBy: 1,
    createdAt: "",
    updatedAt: ""
  };

  beforeEach(() => {
    vi.mocked(getAlbumBySlug).mockResolvedValue(null);
  });

  describe("GET (Read by slug)", () => {
    it("returns 400 when slug missing", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when album not found", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "nonexistent" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 and album when found", async () => {
      vi.mocked(getAlbumBySlug).mockResolvedValue(album as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ slug: "my-album" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.slug).toBe("my-album");
    });
  });
});
