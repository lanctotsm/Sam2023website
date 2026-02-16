import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { jsonRequest, MOCK_AUTH_USER } from "../../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (msg: string, status: number) => new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/services/images", () => ({ createImage: vi.fn() }));
vi.mock("@/lib/serializers", () => ({ serializeImage: (i: unknown) => i }));

const { getAuthUser } = await import("@/lib/api-utils");
const { createImage } = await import("@/services/images");

describe("BATCH /api/images/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(createImage).mockResolvedValue({
      id: 1,
      s3Key: "uploads/test.jpg",
      width: 800,
      height: 600,
      caption: null,
      altText: null,
      createdBy: 1,
      createdAt: "2024-01-01T00:00:00Z"
    } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await POST(jsonRequest("POST", "http://x", { images: [] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when images array is missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("images array is required");
  });

  it("returns 400 when images array is empty", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", { images: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when s3_key is missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      images: [{ caption: "Test" }]
    }));
    expect(res.status).toBe(500);
  });

  it("returns 201 with created images for valid single image", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      images: [{
        s3_key: "uploads/test.jpg",
        width: 800,
        height: 600,
        caption: "Test Photo",
        alt_text: "A test photo"
      }]
    }));
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.images).toHaveLength(1);
    expect(createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        s3Key: "uploads/test.jpg",
        width: 800,
        height: 600,
        caption: "Test Photo",
        altText: "A test photo",
        createdBy: 1
      })
    );
  });

  it("returns 201 with created images for multiple images", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    let callCount = 0;
    vi.mocked(createImage).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        id: callCount,
        s3Key: `uploads/test${callCount}.jpg`,
        width: 800,
        height: 600,
        caption: null,
        altText: null,
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00Z"
      } as never);
    });
    
    const res = await POST(jsonRequest("POST", "http://x", {
      images: [
        { s3_key: "uploads/photo1.jpg", caption: "Photo 1" },
        { s3_key: "uploads/photo2.jpg", caption: "Photo 2" },
        { s3_key: "uploads/photo3.jpg", caption: "Photo 3" }
      ]
    }));
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.images).toHaveLength(3);
    expect(createImage).toHaveBeenCalledTimes(3);
  });

  it("handles images with null dimensions", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      images: [{
        s3_key: "uploads/test.jpg",
        width: null,
        height: null,
        caption: "",
        alt_text: ""
      }]
    }));
    
    expect(res.status).toBe(201);
    expect(createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        width: null,
        height: null
      })
    );
  });

  it("trims caption and alt_text", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      images: [{
        s3_key: "uploads/test.jpg",
        caption: "  Trimmed Caption  ",
        alt_text: "  Trimmed Alt  "
      }]
    }));
    
    expect(res.status).toBe(201);
    expect(createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: "Trimmed Caption",
        altText: "Trimmed Alt"
      })
    );
  });

  it("passes user ID to all image creations", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ ...MOCK_AUTH_USER, id: 42 } as never);
    let callCount = 0;
    vi.mocked(createImage).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        id: callCount,
        s3Key: `uploads/test${callCount}.jpg`,
        width: null,
        height: null,
        caption: null,
        altText: null,
        createdBy: 42,
        createdAt: "2024-01-01T00:00:00Z"
      } as never);
    });
    
    const res = await POST(jsonRequest("POST", "http://x", {
      images: [
        { s3_key: "uploads/photo1.jpg" },
        { s3_key: "uploads/photo2.jpg" }
      ]
    }));
    
    expect(res.status).toBe(201);
    const calls = vi.mocked(createImage).mock.calls;
    calls.forEach((call) => {
      expect(call[0]).toMatchObject({ createdBy: 42 });
    });
  });
});
