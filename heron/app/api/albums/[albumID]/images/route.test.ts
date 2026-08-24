import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, POST } from "./route";
import { jsonRequest, getRequest, getParams, MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/albums", () => ({
  getAlbumById: vi.fn()
}));

vi.mock("@/services/albumImages", () => ({
  getAlbumImages: vi.fn(),
  updateAlbumImagesOrder: vi.fn(),
  addAlbumImage: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializeImage: (i: unknown) => i
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAlbumById } = await import("@/services/albums");
const { getAlbumImages, updateAlbumImagesOrder, addAlbumImage } = await import("@/services/albumImages");

describe("ALBUMS /api/albums/[albumID]/images", () => {
  const album = { id: 1, title: "A", slug: "a", description: "", createdBy: 1, createdAt: "", updatedAt: "" };

  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getAlbumById).mockResolvedValue(null);
    vi.mocked(getAlbumImages).mockResolvedValue([]);
    vi.mocked(addAlbumImage).mockResolvedValue(undefined);
  });

  describe("GET (Read)", () => {
    it("returns 400 for invalid album id", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ albumID: "x" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when album not found", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ albumID: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 and list of images with sort_order", async () => {
      vi.mocked(getAlbumById).mockResolvedValue(album as never);
      const rows = [
        { id: 1, s3Key: "k", width: 100, height: 100, caption: null, altText: null, createdAt: "", sortOrder: 0 }
      ];
      vi.mocked(getAlbumImages).mockResolvedValue(rows as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ albumID: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty("sort_order", 0);
    });
  });

  describe("PUT (Reorder)", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await PUT(
        jsonRequest("PUT", "http://x", { order: [1, 2] }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(401);
      expect(updateAlbumImagesOrder).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid album id", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { order: [1] }),
        { params: getParams({ albumID: "x" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when album not found", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { order: [1] }),
        { params: getParams({ albumID: "999" }) }
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when order is not array of numbers", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getAlbumById).mockResolvedValue(album as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { order: ["a"] }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 and calls updateAlbumImagesOrder when valid", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getAlbumById).mockResolvedValue(album as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { order: [2, 1] }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(200);
      expect(updateAlbumImagesOrder).toHaveBeenCalledWith(1, [2, 1]);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });
  });

  describe("POST (Link image)", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await POST(
        jsonRequest("POST", "http://x", { image_id: 2, sort_order: 0 }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(401);
      expect(addAlbumImage).not.toHaveBeenCalled();
    });

    it("returns 400 when image_id is invalid", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getAlbumById).mockResolvedValue(album as never);
      const res = await POST(
        jsonRequest("POST", "http://x", { image_id: 0, sort_order: 0 }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 201 and links the image", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getAlbumById).mockResolvedValue(album as never);
      const res = await POST(
        jsonRequest("POST", "http://x", { image_id: 9, sort_order: 2 }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(201);
      expect(addAlbumImage).toHaveBeenCalledWith(1, 9, 2);
    });
  });
});
