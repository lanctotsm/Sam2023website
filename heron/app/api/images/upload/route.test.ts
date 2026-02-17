import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { MOCK_AUTH_USER } from "../../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/services/images", () => ({
  createImage: vi.fn(),
  deleteImage: vi.fn()
}));
vi.mock("@/services/albumImages", () => ({ addAlbumImage: vi.fn() }));
vi.mock("@/lib/s3", () => ({ putObject: vi.fn(), deleteObjects: vi.fn() }));
vi.mock("@/lib/image-processing", () => ({
  processImage: vi.fn()
}));
vi.mock("@/lib/serializers", () => ({ serializeImage: (i: unknown) => i }));

const { getAuthUser } = await import("@/lib/api-utils");
const { createImage } = await import("@/services/images");
const { addAlbumImage } = await import("@/services/albumImages");
const { putObject } = await import("@/lib/s3");
const { processImage } = await import("@/lib/image-processing");

const mockProcessed = {
  thumb: { buffer: Buffer.from("thumb"), width: 100, height: 80 },
  large: { buffer: Buffer.from("large"), width: 800, height: 600 },
  original: {
    buffer: Buffer.from("orig"),
    width: 800,
    height: 600,
    contentType: "image/jpeg"
  }
};

function formRequestWithFiles(files: File[], fields?: { album_id?: string; caption?: string; alt_text?: string }) {
  const form = new FormData();
  if (fields?.album_id != null) form.set("album_id", fields.album_id);
  if (fields?.caption != null) form.set("caption", fields.caption);
  if (fields?.alt_text != null) form.set("alt_text", fields.alt_text);
  files.forEach((f) => form.append("files", f));
  return new Request("http://x/api/images/upload", {
    method: "POST",
    body: form
  });
}

describe("POST /api/images/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(processImage).mockResolvedValue(mockProcessed as never);
    vi.mocked(putObject).mockResolvedValue(undefined);
    vi.mocked(createImage).mockResolvedValue({
      id: 42,
      s3Key: "uploads/uuid/large.jpg",
      s3KeyThumb: "uploads/uuid/thumb.jpg",
      s3KeyLarge: "uploads/uuid/large.jpg",
      s3KeyOriginal: "uploads/uuid/original.jpg",
      width: 800,
      height: 600,
      caption: null,
      altText: null,
      createdBy: 1,
      createdAt: "2024-01-01T00:00:00Z"
    } as never);
    vi.mocked(addAlbumImage).mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    const file = new File([new Blob(["x"])], "test.jpg", { type: "image/jpeg" });
    const res = await POST(formRequestWithFiles([file]));
    expect(res.status).toBe(401);
    expect(processImage).not.toHaveBeenCalled();
  });

  it("returns 400 when no files", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(formRequestWithFiles([]));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("at least one file is required");
    expect(processImage).not.toHaveBeenCalled();
  });

  it("returns 400 when file type is not allowed", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const file = new File([new Blob(["x"])], "x.pdf", { type: "application/pdf" });
    const res = await POST(formRequestWithFiles([file]));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/unsupported type/);
    expect(processImage).not.toHaveBeenCalled();
  });

  it("returns 201 with one file and creates image with variant keys", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const file = new File([new Blob(["\xff\xd8\xff"])], "photo.jpg", { type: "image/jpeg" });
    const res = await POST(formRequestWithFiles([file]));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.images).toHaveLength(1);
    expect(data.images[0].id).toBe(42);
    expect(processImage).toHaveBeenCalledTimes(1);
    expect(putObject).toHaveBeenCalledTimes(3); // thumb, large, original
    expect(createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        s3Key: expect.stringMatching(/uploads\/.+\/large\.jpg/),
        s3KeyThumb: expect.stringMatching(/uploads\/.+\/thumb\.jpg/),
        s3KeyLarge: expect.stringMatching(/uploads\/.+\/large\.jpg/),
        s3KeyOriginal: expect.stringMatching(/uploads\/.+\/original\.jpg/),
        width: 800,
        height: 600,
        createdBy: 1
      })
    );
    expect(addAlbumImage).not.toHaveBeenCalled();
  });

  it("returns 201 and calls addAlbumImage when album_id provided", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const file = new File([new Blob(["\xff\xd8\xff"])], "a.jpg", { type: "image/jpeg" });
    const res = await POST(formRequestWithFiles([file], { album_id: "5" }));
    expect(res.status).toBe(201);
    expect(addAlbumImage).toHaveBeenCalledWith(5, 42, 0);
  });

  it("passes caption and alt_text to createImage", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const file = new File([new Blob(["\xff\xd8\xff"])], "a.jpg", { type: "image/jpeg" });
    await POST(formRequestWithFiles([file], { caption: "A caption", alt_text: "Alt" }));
    expect(createImage).toHaveBeenCalledWith(
      expect.objectContaining({ caption: "A caption", altText: "Alt" })
    );
  });
});
