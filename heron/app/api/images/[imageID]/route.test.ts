import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { jsonRequest, getRequest, getParams, MOCK_AUTH_USER } from "../../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  parseId: (v: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  errorResponse: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/images", () => ({
  getImageById: vi.fn(),
  updateImage: vi.fn(),
  deleteImage: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializeImage: (i: unknown) => i
}));

vi.mock("@/lib/s3", () => ({
  deleteObjects: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getImageById, updateImage, deleteImage } = await import("@/services/images");

describe("IMAGES /api/images/[imageID]", () => {
  const image = {
    id: 1,
    s3Key: "uploads/uuid/large.jpg",
    s3KeyThumb: "uploads/uuid/thumb.jpg",
    s3KeyLarge: "uploads/uuid/large.jpg",
    s3KeyOriginal: "uploads/uuid/original.jpg",
    width: 100,
    height: 100,
    caption: null,
    altText: null,
    createdBy: 1,
    createdAt: ""
  };

  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getImageById).mockResolvedValue(null);
  });

  describe("GET (Read)", () => {
    it("returns 400 for invalid id", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ imageID: "x" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when image not found", async () => {
      const res = await GET(getRequest("http://x"), { params: getParams({ imageID: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 and image when found", async () => {
      vi.mocked(getImageById).mockResolvedValue(image as never);
      const res = await GET(getRequest("http://x"), { params: getParams({ imageID: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(1);
    });
  });

  describe("PUT (Update)", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await PUT(
        jsonRequest("PUT", "http://x", { s3_key: "k" }),
        { params: getParams({ imageID: "1" }) }
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 when s3_key missing", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", {}),
        { params: getParams({ imageID: "1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when updateImage returns null", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(updateImage).mockResolvedValue(null);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { s3_key: "k" }),
        { params: getParams({ imageID: "1" }) }
      );
      expect(res.status).toBe(404);
    });

    it("returns 200 and updated image when valid", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(updateImage).mockResolvedValue({ ...image, caption: "New" } as never);
      const res = await PUT(
        jsonRequest("PUT", "http://x", { s3_key: "k", caption: "New" }),
        { params: getParams({ imageID: "1" }) }
      );
      expect(res.status).toBe(200);
      expect(updateImage).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await DELETE(getRequest("http://x"), { params: getParams({ imageID: "1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid id", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ imageID: "0" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when image not found", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getImageById).mockResolvedValue(null);
      const res = await DELETE(getRequest("http://x"), { params: getParams({ imageID: "1" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200, deletes S3 objects, and calls deleteImage", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
      vi.mocked(getImageById).mockResolvedValue(image as never);
      const { deleteObjects } = await import("@/lib/s3");
      const res = await DELETE(getRequest("http://x"), { params: getParams({ imageID: "1" }) });
      expect(res.status).toBe(200);
      expect(deleteObjects).toHaveBeenCalledWith(
        expect.arrayContaining([
          "uploads/uuid/large.jpg",
          "uploads/uuid/thumb.jpg",
          "uploads/uuid/original.jpg"
        ])
      );
      expect(deleteImage).toHaveBeenCalledWith(1);
      const data = await res.json();
      expect(data.status).toBe("deleted");
    });
  });
});
