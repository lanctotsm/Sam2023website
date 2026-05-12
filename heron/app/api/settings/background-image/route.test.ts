import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { MOCK_AUTH_USER } from "../../__tests__/helpers";

// Mock external dependencies
vi.mock("@/lib/api-utils", () => ({
    getAuthUser: vi.fn(),
    errorResponse: (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/lib/s3", () => ({
    putObject: vi.fn()
}));

vi.mock("@/lib/images", () => ({
    buildImageUrl: (key: string) => `https://mock-image-url.com/${key}`
}));

// Mock sharp
vi.mock("sharp", () => {
    const sharpMock = vi.fn().mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-processed-image"))
    });
    return { default: sharpMock };
});

const { getAuthUser } = await import("@/lib/api-utils");
const { putObject } = await import("@/lib/s3");

describe("SETTINGS /api/settings/background-image", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(null);
        
        const req = new Request("http://localhost:3000/api/settings/background-image", {
            method: "POST"
        });
        
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it("returns 413 when content-length exceeds max file size", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        
        const req = new Request("http://localhost:3000/api/settings/background-image", {
            method: "POST",
            headers: {
                "content-length": "30000000" // ~30MB
            }
        });
        
        const res = await POST(req);
        expect(res.status).toBe(413);
        const data = await res.json();
        expect(data.error).toBe("request too large");
    });

    it("returns 400 when file is missing in form data", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        
        const formData = new FormData();
        const req = new Request("http://localhost:3000/api/settings/background-image", {
            method: "POST",
            body: formData
        });
        
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("file is required");
    });

    it("returns 400 when file is unsupported type", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        
        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        const formData = new FormData();
        formData.append("file", file);
        
        const req = new Request("http://localhost:3000/api/settings/background-image", {
            method: "POST",
            body: formData
        });
        
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("unsupported file type");
    });

    it("returns 400 when file size exceeds max bytes", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        
        // Define max size property logic using Object.defineProperty to bypass File constructor limits for test
        const fileContent = new ArrayBuffer(21 * 1024 * 1024); // 21MB
        const file = new File([fileContent], "large.jpg", { type: "image/jpeg" });
        Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 });

        const formData = new FormData();
        formData.append("file", file);
        
        const req = new Request("http://localhost:3000/api/settings/background-image", {
            method: "POST",
            body: formData
        });
        
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("file exceeds max size");
    });

    it("processes and uploads image successfully", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        
        const file = new File(["dummy-image-data"], "test.jpg", { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("file", file);
        
        const req = new Request("http://localhost:3000/api/settings/background-image", {
            method: "POST",
            body: formData
        });
        
        const res = await POST(req);
        expect(res.status).toBe(201);
        
        const data = await res.json();
        expect(data.url).toMatch(/^https:\/\/mock-image-url\.com\/backgrounds\/.*\.jpg$/);
        
        expect(putObject).toHaveBeenCalled();
        const callArgs = vi.mocked(putObject).mock.calls[0][0];
        expect(callArgs.contentType).toBe("image/jpeg");
        expect(callArgs.key).toMatch(/^backgrounds\/.*\.jpg$/);
        expect(callArgs.body).toBeInstanceOf(Buffer);
    });
});
