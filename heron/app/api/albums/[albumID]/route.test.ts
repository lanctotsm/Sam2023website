import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { jsonRequest, getRequest, getParams, MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  parseId: (v: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/albums", () => ({
  getAlbumById: vi.fn(),
  updateAlbum: vi.fn(),
  deleteAlbum: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializeAlbum: (a: unknown) => a
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAlbumById, updateAlbum, deleteAlbum } = await import("@/services/albums");

describe("ALBUMS /api/albums/[albumID]", () => {
  const album = {
    id: 1,
    title: "Album",
    slug: "album",
    description: "",
    sortOrder: 0,
    createdAt: "",
    updatedAt: ""
  };

  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getAlbumById).mockResolvedValue(null);
  });

  describe("GET (Read)", () => {
    it("returns 400 for invalid id", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ albumID: "abc" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when album not found", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ albumID: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 and album when found", async () => {
      vi.mocked(getAlbumById).mockResolvedValue(album as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ albumID: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(1);
      expect(data.title).toBe("Album");
    });
  });

  describe("PUT (Update)", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "T", slug: "t" }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(401);
      expect(updateAlbum).not.toHaveBeenCalled();
    });

    it("returns 400 when payload missing title or slug", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "" }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when updateAlbum returns null", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(updateAlbum).mockResolvedValue(null);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "T", slug: "t" }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(404);
    });

    it("returns 200 and updated album when valid", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(updateAlbum).mockResolvedValue({ ...album, title: "Updated" } as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { title: "Updated", slug: "album" }),
        { params: getParams({ albumID: "1" }) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe("Updated");
      expect(updateAlbum).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await DELETE(getRequest("http://x"), { params: getParams({ albumID: "1" }) });
      expect(res.status).toBe(401);
      expect(deleteAlbum).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid id", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ albumID: "0" }) });
      expect(res.status).toBe(400);
    });

    it("returns 200 and calls deleteAlbum", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ albumID: "1" }) });
      expect(res.status).toBe(200);
      expect(deleteAlbum).toHaveBeenCalledWith(1);
      const data = await res.json();
      expect(data.status).toBe("deleted");
    });
  });
});
