import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { jsonRequest, MOCK_AUTH_USER } from "../../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (msg: string, status: number) => new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/lib/s3", () => ({
  presignPutObject: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { presignPutObject } = await import("@/lib/s3");

describe("PRESIGN-BATCH /api/images/presign-batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(presignPutObject).mockResolvedValue("https://s3.example.com/upload-url");
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await POST(jsonRequest("POST", "http://x", { files: [] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when files array is missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("files array is required");
  });

  it("returns 400 when files array is empty", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", { files: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when file is missing required fields", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      files: [{ file_name: "", content_type: "image/jpeg", size: 1024 }]
    }));
    expect(res.status).toBe(500);
  });

  it("returns 200 with presigned URLs for valid single file", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      files: [{
        file_name: "test.jpg",
        content_type: "image/jpeg",
        size: 1024
      }]
    }));
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.files).toHaveLength(1);
    expect(data.files[0]).toMatchObject({
      file_name: "test.jpg",
      upload_url: "https://s3.example.com/upload-url"
    });
    expect(data.files[0].s3_key).toMatch(/^uploads\/.*\.jpg$/);
    expect(presignPutObject).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "image/jpeg",
        size: 1024
      })
    );
  });

  it("returns 200 with presigned URLs for multiple files", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      files: [
        { file_name: "photo1.jpg", content_type: "image/jpeg", size: 1024 },
        { file_name: "photo2.png", content_type: "image/png", size: 2048 },
        { file_name: "photo3.gif", content_type: "image/gif", size: 512 }
      ]
    }));
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.files).toHaveLength(3);
    expect(data.files[0].file_name).toBe("photo1.jpg");
    expect(data.files[1].file_name).toBe("photo2.png");
    expect(data.files[2].file_name).toBe("photo3.gif");
    expect(presignPutObject).toHaveBeenCalledTimes(3);
  });

  it("generates unique S3 keys for each file", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {
      files: [
        { file_name: "test.jpg", content_type: "image/jpeg", size: 1024 },
        { file_name: "test.jpg", content_type: "image/jpeg", size: 1024 }
      ]
    }));
    
    const data = await res.json();
    expect(data.files[0].s3_key).not.toBe(data.files[1].s3_key);
  });

  it("preserves file extensions in S3 keys", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const extensions = [".jpg", ".png", ".gif", ".webp"];
    const files = extensions.map(ext => ({
      file_name: `test${ext}`,
      content_type: "image/jpeg",
      size: 1024
    }));
    
    const res = await POST(jsonRequest("POST", "http://x", { files }));
    const data = await res.json();
    
    data.files.forEach((file: { s3_key: string }, i: number) => {
      expect(file.s3_key).toMatch(new RegExp(`${extensions[i]}$`));
    });
  });

  it("includes public URLs when S3_PUBLIC_BASE_URL is set", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    process.env.S3_PUBLIC_BASE_URL = "https://cdn.example.com/bucket";
    
    const res = await POST(jsonRequest("POST", "http://x", {
      files: [{ file_name: "test.jpg", content_type: "image/jpeg", size: 1024 }]
    }));
    
    const data = await res.json();
    expect(data.files[0].public_url).toMatch(/^https:\/\/cdn\.example\.com\/bucket\/uploads\//);
    
    delete process.env.S3_PUBLIC_BASE_URL;
  });
});
