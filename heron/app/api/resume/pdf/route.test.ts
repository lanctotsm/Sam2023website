import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { sanitizeResumeDocument } from "@/lib/resume/parse";

vi.mock("@/lib/api-utils", () => ({
    errorResponse: (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/resumePdf", () => ({
    getResumePdfInfo: vi.fn()
}));

vi.mock("@/services/resume", () => ({
    getResume: vi.fn()
}));

const { getResumePdfInfo } = await import("@/services/resumePdf");
const { getResume } = await import("@/services/resume");

const CURRENT_MODIFIED = "2026-08-16T00:00:00.000Z";
const PDF_URL = "https://cdn.example.com/cms/resume/sam-abc12345.pdf";

function currentResume() {
    const doc = sanitizeResumeDocument({ basics: { name: "Sam" } });
    doc.meta.lastModified = CURRENT_MODIFIED;
    return doc;
}

describe("RESUME /api/resume/pdf", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getResumePdfInfo).mockResolvedValue(null);
        vi.mocked(getResume).mockResolvedValue(currentResume());
    });

    it("302-redirects to the recorded object URL when it matches the current document", async () => {
        vi.mocked(getResumePdfInfo).mockResolvedValue({
            url: PDF_URL,
            generatedAt: CURRENT_MODIFIED,
            sourceLastModified: CURRENT_MODIFIED
        });
        const res = await GET();
        expect(res.status).toBe(302);
        expect(res.headers.get("Location")).toBe(PDF_URL);
    });

    it("returns 404 with a clear message when no PDF exists", async () => {
        const res = await GET();
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toContain("No PDF has been generated yet");
    });

    it("returns 404 instead of redirecting when the recorded PDF is stale", async () => {
        vi.mocked(getResumePdfInfo).mockResolvedValue({
            url: PDF_URL,
            generatedAt: "2026-08-15T00:00:00.000Z",
            sourceLastModified: "2026-08-15T00:00:00.000Z"
        });
        const res = await GET();
        expect(res.status).toBe(404);
        expect(res.headers.get("Location")).toBeNull();
        const data = await res.json();
        expect(data.error).toMatch(/out of date|stale|failed/i);
    });
});
