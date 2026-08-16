import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { MOCK_AUTH_USER } from "../../../__tests__/helpers";
import { createDefaultResume } from "@/lib/resume/defaults";

vi.mock("@/lib/api-utils", () => ({
    getAuthUser: vi.fn(),
    errorResponse: (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/resume", () => ({
    getResume: vi.fn()
}));

vi.mock("@/services/resumePdf", () => ({
    renderAndPublishResumePdf: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getResume } = await import("@/services/resume");
const { renderAndPublishResumePdf } = await import("@/services/resumePdf");

describe("RESUME /api/resume/pdf/regenerate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthUser).mockResolvedValue(null);
        vi.mocked(getResume).mockResolvedValue(createDefaultResume());
        vi.mocked(renderAndPublishResumePdf).mockResolvedValue({
            status: "ok",
            url: "https://cdn.example.com/cms/resume/x.pdf",
            generatedAt: "2026-08-15T00:00:00.000Z"
        });
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await POST();
        expect(res.status).toBe(401);
        expect(renderAndPublishResumePdf).not.toHaveBeenCalled();
    });

    it("re-renders from the stored document and reports the result", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        const res = await POST();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.pdf.status).toBe("ok");
        expect(getResume).toHaveBeenCalledTimes(1);
    });
});
