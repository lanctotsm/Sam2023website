import { describe, it, expect } from "vitest";
import { toJsonResume } from "./jsonResume";
import { sanitizeResumeDocument } from "./parse";
import { createDefaultResume } from "./defaults";

function sampleDoc() {
    return sanitizeResumeDocument({
        basics: {
            name: "Sam Lanctot",
            label: "Senior Software Engineer",
            email: "sam@example.com",
            phone: "",
            url: "https://samlanctot.com",
            summary: "Builds things.",
            location: { city: "Chevy Chase", region: "MD" },
            profiles: [{ id: "p1", network: "GitHub", username: "sam", url: "https://github.com/sam" }]
        },
        work: [
            {
                id: "w1",
                name: "GEICO",
                position: "Senior Engineer",
                location: "",
                url: "",
                startDate: "2021-06",
                endDate: "",
                summary: "Commercial insurance platform.",
                highlights: ["Automated issue processes"]
            }
        ],
        skills: [{ id: "s1", name: "Primary", keywords: ["TypeScript"] }],
        meta: { heron: { condensedWorkIds: ["w1"] } }
    });
}

describe("lib/resume/jsonResume", () => {
    it("drops empty optional fields, including blank phone", () => {
        const out = toJsonResume(sampleDoc()) as { basics: Record<string, unknown>; work: Array<Record<string, unknown>> };
        expect(out.basics.phone).toBeUndefined();
        expect(out.work[0].location).toBeUndefined();
        expect(out.work[0].url).toBeUndefined();
        expect(out.basics.name).toBe("Sam Lanctot");
    });

    it("preserves an empty endDate as the present signal", () => {
        const out = toJsonResume(sampleDoc()) as { work: Array<Record<string, unknown>> };
        expect(out.work[0]).toHaveProperty("endDate", "");
    });

    it("retains meta.heron and entry ids so references round-trip", () => {
        const out = toJsonResume(sampleDoc()) as {
            work: Array<Record<string, unknown>>;
            meta: { heron: { condensedWorkIds: string[] } };
        };
        expect(out.work[0].id).toBe("w1");
        expect(out.meta.heron.condensedWorkIds).toEqual(["w1"]);
    });

    it("stamps meta.canonical when provided and keeps schema version", () => {
        const out = toJsonResume(sampleDoc(), { canonical: "https://samlanctot.com/resume" }) as {
            meta: Record<string, unknown>;
        };
        expect(out.meta.canonical).toBe("https://samlanctot.com/resume");
        expect(out.meta.version).toBe("v1.0.0");
    });

    it("omits empty top-level sections on an empty document but keeps basics name and meta", () => {
        const out = toJsonResume(createDefaultResume()) as Record<string, unknown>;
        expect(out.work).toBeUndefined();
        expect(out.certificates).toBeUndefined();
        expect(out.meta).toBeDefined();
    });
});
