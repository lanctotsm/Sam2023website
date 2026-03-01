import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getParams } from "../../../__tests__/helpers";

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

describe("GET /api/albums/slug/[slug]", () => {
  beforeEach(() => {
    vi.mocked(getAlbumBySlug).mockReset();
  });

  it("returns 400 when slug is empty", async () => {
    const req = new Request("http://x");
    const res = await GET(req, { params: getParams({ slug: "" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when album not found", async () => {
    vi.mocked(getAlbumBySlug).mockResolvedValue(null as never);
    const req = new Request("http://x");
    const res = await GET(req, { params: getParams({ slug: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 and album when found", async () => {
    const album = {
      id: 1,
      title: "Beach Trip",
      slug: "beach-trip",
      description: "Down the shore",
      coverImageS3Key: "uploads/thumb.jpg",
      createdBy: 1,
      createdAt: "",
      updatedAt: ""
    };
    vi.mocked(getAlbumBySlug).mockResolvedValue(album as never);
    const req = new Request("http://x");
    const res = await GET(req, { params: getParams({ slug: "beach-trip" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Beach Trip");
    expect(getAlbumBySlug).toHaveBeenCalledWith("beach-trip");
  });
});
