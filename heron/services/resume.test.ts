import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDefaultResume } from "@/lib/resume/defaults";

vi.mock("@/services/settings", () => ({
    getSetting: vi.fn(),
    updateSetting: vi.fn()
}));

const { getSetting, updateSetting } = await import("@/services/settings");
const { getResume, saveResume, RESUME_SETTING_KEY } = await import("./resume");

describe("services/resume", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getSetting).mockResolvedValue(null);
        vi.mocked(updateSetting).mockResolvedValue(undefined);
    });

    describe("getResume", () => {
        it("returns the default document when the settings row is absent", async () => {
            const doc = await getResume();
            expect(doc).toEqual(createDefaultResume());
            expect(getSetting).toHaveBeenCalledWith(RESUME_SETTING_KEY);
        });

        it("parses and sanitizes the stored JSON", async () => {
            vi.mocked(getSetting).mockResolvedValue(
                JSON.stringify({ basics: { name: "  Sam  " }, work: "garbage" })
            );
            const doc = await getResume();
            expect(doc.basics.name).toBe("Sam");
            expect(doc.work).toEqual([]);
        });
    });

    describe("saveResume", () => {
        it("sanitizes, stamps lastModified, and upserts the settings row", async () => {
            const before = new Date().toISOString();
            const saved = await saveResume({ basics: { name: "Sam" }, work: [{ name: "Acme" }] });
            expect(saved.basics.name).toBe("Sam");
            expect(saved.work[0].id).toBeTruthy();
            expect(saved.meta.lastModified >= before).toBe(true);

            expect(updateSetting).toHaveBeenCalledTimes(1);
            const [key, value] = vi.mocked(updateSetting).mock.calls[0];
            expect(key).toBe(RESUME_SETTING_KEY);
            expect(JSON.parse(value)).toEqual(saved);
        });
    });
});
