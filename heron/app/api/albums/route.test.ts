import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { jsonRequest, getRequest, MOCK_AUTH_USER } from "../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/albums", () => ({
  getAllAlbums: vi.fn(),
  createAlbum: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializeAlbum: (a: unknown) => a
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAllAlbums, createAlbum } = await import("@/services/albums");

describe("ALBUMS /api/albums", () => {
  beforeEach(() => {
    vi.mocked(getAllAlbums).mockResolvedValue([]);
  });

  describe("GET", () => {
    it("returns 200 and list of albums", async () => {
      const albums = [
        { id: 1, title: "Album", slug: "album", description: "", createdBy: 1, createdAt: "", updatedAt: "" }
      ];
      vi.mocked(getAllAlbums).mockResolvedValue(albums as never);
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe("Album");
    });
  });

  describe("POST (Create)", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(null);
      const res = await POST(
        jsonRequest("POST", "http://x", { title: "A", slug: "a", description: "d" })
      );
      expect(res.status).toBe(401);
      expect(createAlbum).not.toHaveBeenCalled();
    });

    it("returns 400 when title or slug missing", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await POST(jsonRequest("POST", "http://x", { title: "A" }));
      expect(res.status).toBe(400);
    });

    it("returns 201 and created album when valid", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const created = {
        id: 1,
        title: "New",
        slug: "new",
        description: "D",
        createdBy: 1,
        createdAt: "",
        updatedAt: ""
      };
      vi.mocked(createAlbum).mockResolvedValue(created as never);
      const res = await POST(
        jsonRequest("POST", "http://x", { title: "New", slug: "new", description: "D" })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.title).toBe("New");
      expect(createAlbum).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New", slug: "new", createdBy: 1 })
      );
    });
  });
});
