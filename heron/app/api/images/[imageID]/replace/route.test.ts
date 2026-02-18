import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "./route";
import { getParams, MOCK_AUTH_USER } from "../../../__tests__/helpers";

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
  updateImage: vi.fn()
}));

vi.mock("@/lib/serializers", () => ({
  serializeImage: (i: unknown) => i
}));

vi.mock("@/lib/s3", () => ({
  deleteObjects: vi.fn(),
  putObject: vi.fn()
}));

vi.mock("@/lib/image-processing", () => ({
  processImage: vi.fn().mockResolvedValue({
    thumb: { buffer: Buffer.from("thumb") },
    large: { buffer: Buffer.from("large"), width: 100, height: 100 },
    original: { buffer: Buffer.from("orig"), contentType: "image/jpeg" }
  })
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getImageById, updateImage } = await import("@/services/images");

const imageRow = {
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

describe("IMAGES /api/images/[imageID]/replace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getImageById).mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "image/jpeg" }), "test.jpg");
    const res = await PUT(new Request("http://x", { method: "PUT", body: formData }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid image id", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "image/jpeg" }), "test.jpg");
    const res = await PUT(new Request("http://x", { method: "PUT", body: formData }), {
      params: getParams({ imageID: "abc" })
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when image not found", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "image/jpeg" }), "test.jpg");
    const res = await PUT(new Request("http://x", { method: "PUT", body: formData }), {
      params: getParams({ imageID: "999" })
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 when file is missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getImageById).mockResolvedValue(imageRow as never);
    const formData = new FormData();
    const res = await PUT(new Request("http://x", { method: "PUT", body: formData }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for unsupported file type", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getImageById).mockResolvedValue(imageRow as never);
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "application/pdf" }), "doc.pdf");
    const res = await PUT(new Request("http://x", { method: "PUT", body: formData }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(400);
  });

  it("returns 200 and updated image when valid", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getImageById).mockResolvedValue(imageRow as never);
    vi.mocked(updateImage).mockResolvedValue({ ...imageRow, caption: "New" } as never);

    const formData = new FormData();
    formData.append("file", new Blob(["x".repeat(100)], { type: "image/jpeg" }), "photo.jpg");
    const res = await PUT(new Request("http://x", { method: "PUT", body: formData }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(1);
    expect(updateImage).toHaveBeenCalled();
  });
});
