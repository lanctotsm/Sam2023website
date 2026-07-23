import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
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
  getImageById: vi.fn()
}));

vi.mock("@/services/settings", () => ({
  getSetting: vi.fn()
}));

vi.mock("@/lib/s3", () => ({
  getObject: vi.fn()
}));

vi.mock("@/lib/ai/generate-image-alt", () => ({
  detectImageFormat: vi.fn(() => "jpeg"),
  generateAltTextFromBytes: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getImageById } = await import("@/services/images");
const { getSetting } = await import("@/services/settings");
const { getObject } = await import("@/lib/s3");
const { generateAltTextFromBytes } = await import("@/lib/ai/generate-image-alt");

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

describe("POST /api/images/[imageID]/generate-alt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getSetting).mockResolvedValue("true");
    vi.mocked(getImageById).mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await POST(new Request("http://x", { method: "POST" }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when AI alt text is disabled", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getSetting).mockResolvedValue("false");
    const res = await POST(new Request("http://x", { method: "POST" }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when image not found", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(new Request("http://x", { method: "POST" }), {
      params: getParams({ imageID: "999" })
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 with alt_text on success", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getImageById).mockResolvedValue(imageRow as never);
    vi.mocked(getObject).mockResolvedValue(Buffer.from("image"));
    vi.mocked(generateAltTextFromBytes).mockResolvedValue("A rocky shoreline at dusk");

    const res = await POST(new Request("http://x", { method: "POST" }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.alt_text).toBe("A rocky shoreline at dusk");
    expect(generateAltTextFromBytes).toHaveBeenCalledOnce();
  });

  it("returns 502 with a generic message when generation fails", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getImageById).mockResolvedValue(imageRow as never);
    vi.mocked(getObject).mockResolvedValue(Buffer.from("image"));
    vi.mocked(generateAltTextFromBytes).mockRejectedValue(
      new Error("AccessDeniedException: internal detail")
    );

    const res = await POST(new Request("http://x", { method: "POST" }), {
      params: getParams({ imageID: "1" })
    });
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("Failed to generate alt text");
  });
});
