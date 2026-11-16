import { describe, expect, it } from "vitest";
import { createDefaultResume } from "./defaults";
import { resumeEmailIsPublic, resumeForPublic } from "./publish-email";

describe("resumeEmailIsPublic", () => {
    it("stays off unless the setting is exactly true", () => {
        expect(resumeEmailIsPublic(null)).toBe(false);
        expect(resumeEmailIsPublic("")).toBe(false);
        expect(resumeEmailIsPublic("false")).toBe(false);
        expect(resumeEmailIsPublic("true")).toBe(true);
    });
});

describe("resumeForPublic", () => {
    it("removes a stored address when publishing is off", () => {
        const doc = createDefaultResume();
        doc.basics.email = "owner@example.com";
        expect(resumeForPublic(doc, false).basics.email).toBe("");
        expect(doc.basics.email).toBe("owner@example.com");
    });

    it("keeps the address when publishing is on", () => {
        const doc = createDefaultResume();
        doc.basics.email = "owner@example.com";
        expect(resumeForPublic(doc, true).basics.email).toBe("owner@example.com");
    });
});
