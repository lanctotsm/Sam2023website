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
  updateImage: vi.fn(),
  deleteImage: vi.fn()
}));
vi.mock("@/services/albumImages", () => ({ addAlbumImage: vi.fn() }));
vi.mock("@/lib/s3", () => ({ putObject: vi.fn(), deleteObjects: vi.fn() }));
vi.mock("@/lib/image-processing", () => ({
  processImage: vi.fn()
}));
vi.mock("@/lib/serializers", () => ({ serializeImage: (i: unknown) => i }));

const { getAuthUser } = await import("@/lib/api-utils");
const { createImage, updateImage } = await import("@/services/images");
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
      s3Key: "pending/uuid/placeholder.jpg",
      s3KeyThumb: null,
      s3KeyLarge: null,
      s3KeyOriginal: null,
      width: 800,
      height: 600,
      caption: null,
      altText: null,
      createdBy: 1,
      createdAt: "2024-01-01T00:00:00Z"
    } as never);
    vi.mocked(updateImage).mockResolvedValue({
      id: 42,
      s3Key: "uploads/42-large.jpg",
      s3KeyThumb: "uploads/42-thumb.jpg",
      s3KeyLarge: "uploads/42-large.jpg",
      s3KeyOriginal: "uploads/42-original.jpg",
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
        s3Key: expect.stringMatching(/pending\/.+\/placeholder\.jpg/),
        s3KeyThumb: null,
        s3KeyLarge: null,
        s3KeyOriginal: null,
        width: 800,
        height: 600,
        createdBy: 1
      })
    );
    expect(updateImage).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        s3Key: "uploads/42-large.jpg",
        s3KeyThumb: "uploads/42-thumb.jpg",
        s3KeyLarge: "uploads/42-large.jpg",
        s3KeyOriginal: "uploads/42-original.jpg"
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

  it("returns 413 when Content-Length exceeds limit", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const file = new File([new Blob(["x"])], "test.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("files", file);

    // Create request with oversized Content-Length header
    const maxBytes = Number(process.env.MAX_UPLOAD_BYTES) || 100 * 1024 * 1024;
    const req = new Request("http://x/api/images/upload", {
      method: "POST",
      body: form,
      headers: {
        "content-length": String(maxBytes * 2) // Double the limit
      }
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toMatch(/exceeds.*limit/);
    expect(processImage).not.toHaveBeenCalled();
  });

  it("returns 400 when individual file size exceeds MAX_FILE_BYTES", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const maxBytes = Number(process.env.MAX_UPLOAD_BYTES) || 100 * 1024 * 1024;
    // Create a file with actual large content
    const largeBuffer = Buffer.alloc(maxBytes + 1024); // slightly over limit
    const largeFile = new File([largeBuffer], "large.jpg", { type: "image/jpeg" });

    const res = await POST(formRequestWithFiles([largeFile]));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/exceeds max size/);
    expect(processImage).not.toHaveBeenCalled();
  });
});
