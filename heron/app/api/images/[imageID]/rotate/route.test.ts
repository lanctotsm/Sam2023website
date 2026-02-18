import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "./route";
import { jsonRequest, getParams, MOCK_AUTH_USER } from "../../../__tests__/helpers";

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
  getObject: vi.fn().mockResolvedValue(Buffer.from("image")),
  putObject: vi.fn()
}));

vi.mock("@/lib/image-processing", () => ({
  processImage: vi.fn().mockResolvedValue({
    thumb: { buffer: Buffer.from("thumb") },
    large: { buffer: Buffer.from("large"), width: 100, height: 100 },
    original: { buffer: Buffer.from("orig"), contentType: "image/jpeg" }
  }),
  rotateImage: vi.fn().mockResolvedValue(Buffer.from("rotated"))
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

describe("IMAGES /api/images/[imageID]/rotate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getImageById).mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", "http://x", { rotate: 90 }),
      { params: getParams({ imageID: "1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid image id", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await PATCH(
      jsonRequest("PATCH", "http://x", { rotate: 90 }),
      { params: getParams({ imageID: "abc" }) }
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when image not found", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await PATCH(
      jsonRequest("PATCH", "http://x", { rotate: 90 }),
      { params: getParams({ imageID: "999" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when rotate is invalid", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getImageById).mockResolvedValue(imageRow as never);

    const res45 = await PATCH(
      jsonRequest("PATCH", "http://x", { rotate: 45 }),
      { params: getParams({ imageID: "1" }) }
    );
    expect(res45.status).toBe(400);

    const resMissing = await PATCH(
      jsonRequest("PATCH", "http://x", {}),
      { params: getParams({ imageID: "1" }) }
    );
    expect(resMissing.status).toBe(400);
  });

  it("returns 200 and updated image when valid rotation", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getImageById).mockResolvedValue(imageRow as never);
    vi.mocked(updateImage).mockResolvedValue({ ...imageRow } as never);

    const res = await PATCH(
      jsonRequest("PATCH", "http://x", { rotate: 90 }),
      { params: getParams({ imageID: "1" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(1);
    expect(updateImage).toHaveBeenCalled();
  });
});
