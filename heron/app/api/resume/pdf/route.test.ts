import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/api-utils", () => ({
    errorResponse: (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/resumePdf", () => ({
    getResumePdfInfo: vi.fn()
}));

const { getResumePdfInfo } = await import("@/services/resumePdf");

describe("RESUME /api/resume/pdf", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getResumePdfInfo).mockResolvedValue(null);
    });

    it("302-redirects to the recorded object URL", async () => {
        vi.mocked(getResumePdfInfo).mockResolvedValue({
            url: "https://cdn.example.com/cms/resume/sam-abc12345.pdf",
            generatedAt: "2026-08-15T00:00:00.000Z",
            sourceLastModified: "2026-08-15T00:00:00.000Z"
        });
        const res = await GET();
        expect(res.status).toBe(302);
        expect(res.headers.get("Location")).toBe(
            "https://cdn.example.com/cms/resume/sam-abc12345.pdf"
        );
    });

    it("returns 404 with a clear message when no PDF exists", async () => {
        const res = await GET();
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toContain("No PDF has been generated yet");
    });
});
