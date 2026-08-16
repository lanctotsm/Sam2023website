import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";
import { jsonRequest, MOCK_AUTH_USER } from "../__tests__/helpers";
import { createDefaultResume } from "@/lib/resume/defaults";
import { sanitizeResumeDocument } from "@/lib/resume/parse";

vi.mock("@/lib/api-utils", () => ({
    getAuthUser: vi.fn(),
    errorResponse: (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/resume", () => ({
    getResume: vi.fn(),
    saveResume: vi.fn()
}));

vi.mock("@/services/resumePdf", () => ({
    renderAndPublishResumePdf: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getResume, saveResume } = await import("@/services/resume");
const { renderAndPublishResumePdf } = await import("@/services/resumePdf");

describe("RESUME /api/resume", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthUser).mockResolvedValue(null);
        vi.mocked(getResume).mockResolvedValue(createDefaultResume());
        vi.mocked(saveResume).mockImplementation(async (raw) => sanitizeResumeDocument(raw));
        vi.mocked(renderAndPublishResumePdf).mockResolvedValue({
            status: "ok",
            url: "https://cdn.example.com/cms/resume/x.pdf",
            generatedAt: "2026-08-15T00:00:00.000Z"
        });
    });

    describe("GET", () => {
        it("is public and returns the stored document", async () => {
            const res = await GET();
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual(createDefaultResume());
        });
    });

    describe("PUT", () => {
        it("returns 401 when unauthenticated and does not save", async () => {
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/resume", { basics: { name: "X" } })
            );
            expect(res.status).toBe(401);
            expect(saveResume).not.toHaveBeenCalled();
        });

        it("sanitizes via saveResume and returns the persisted document plus pdf status", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/resume", {
                    basics: { name: "Sam" },
                    work: "garbage"
                })
            );
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.resume.basics.name).toBe("Sam");
            expect(data.resume.work).toEqual([]);
            expect(data.pdf.status).toBe("ok");
            expect(renderAndPublishResumePdf).toHaveBeenCalledTimes(1);
        });

        it("still returns a successful save when the render fails", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            vi.mocked(renderAndPublishResumePdf).mockResolvedValue({
                status: "failed",
                error: "typst exploded"
            });
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/resume", { basics: { name: "Sam" } })
            );
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.resume.basics.name).toBe("Sam");
            expect(data.pdf).toEqual({ status: "failed", error: "typst exploded" });
            expect(saveResume).toHaveBeenCalledTimes(1);
        });

        it("returns 400 for a non-JSON body", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const res = await PUT(
                new Request("http://localhost:3000/api/resume", { method: "PUT", body: "not json" })
            );
            expect(res.status).toBe(400);
            expect(saveResume).not.toHaveBeenCalled();
        });
    });
});
