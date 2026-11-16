import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { sanitizeResumeDocument } from "@/lib/resume/parse";
import { createDefaultResume } from "@/lib/resume/defaults";

vi.mock("@/services/resume", () => ({
    getResume: vi.fn()
}));

vi.mock("@/services/settings", () => ({
    getSetting: vi.fn(async () => null)
}));

const { getResume } = await import("@/services/resume");
const { getSetting } = await import("@/services/settings");

describe("RESUME /api/resume/export", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getResume).mockResolvedValue(
            sanitizeResumeDocument({ basics: { name: "Sam Lanctot" } })
        );
        vi.mocked(getSetting).mockResolvedValue(null);
    });

    it("returns an attachment with a name-derived filename", async () => {
        const res = await GET();
        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Disposition")).toBe(
            'attachment; filename="sam-lanctot-resume.json"'
        );
        expect(res.headers.get("Content-Type")).toContain("application/json");
    });

    it("falls back to a generic filename when the name is empty", async () => {
        vi.mocked(getResume).mockResolvedValue(createDefaultResume());
        const res = await GET();
        expect(res.headers.get("Content-Disposition")).toBe(
            'attachment; filename="resume.json"'
        );
    });

    it("body parses as JSON Resume with a canonical meta URL", async () => {
        const res = await GET();
        const data = await res.json();
        expect(data.basics.name).toBe("Sam Lanctot");
        expect(String(data.meta.canonical)).toMatch(/\/resume$/);
        expect(data.meta.heron).toBeDefined();
    });

    it("omits the email address from the public download", async () => {
        vi.mocked(getResume).mockResolvedValue(
            sanitizeResumeDocument({ basics: { name: "Sam Lanctot", email: "owner@example.com" } })
        );
        const res = await GET();
        const data = await res.json();
        expect(data.basics.email).toBeUndefined();
        expect(JSON.stringify(data)).not.toContain("owner@example.com");
    });

    it("includes the email when public email is on", async () => {
        vi.mocked(getSetting).mockResolvedValue("true");
        vi.mocked(getResume).mockResolvedValue(
            sanitizeResumeDocument({ basics: { name: "Sam Lanctot", email: "owner@example.com" } })
        );
        const res = await GET();
        const data = await res.json();
        expect(data.basics.email).toBe("owner@example.com");
    });
});
