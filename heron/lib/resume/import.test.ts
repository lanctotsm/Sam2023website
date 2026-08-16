import { describe, it, expect } from "vitest";
import { importResumeJson } from "./import";

describe("lib/resume/import", () => {
    it("returns an error for invalid JSON and does not produce a document", () => {
        const result = importResumeJson("{not json");
        expect(result.ok).toBe(false);
        if (result.ok) throw new Error("expected failure");
        expect(result.error).toMatch(/not valid JSON/i);
    });

    it("returns an error for a JSON array", () => {
        const result = importResumeJson("[1, 2]");
        expect(result.ok).toBe(false);
        if (result.ok) throw new Error("expected failure");
        expect(result.error).toMatch(/not a JSON Resume/i);
    });

    it("imports JSON Resume volunteer.organization and interests", () => {
        const result = importResumeJson(
            JSON.stringify({
                basics: { name: "Sam" },
                volunteer: [
                    {
                        organization: "Red Cross",
                        position: "Volunteer",
                        startDate: "2020-01",
                        highlights: ["blood drives"]
                    }
                ],
                interests: [{ name: "Music", keywords: ["piano"] }]
            })
        );
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error("expected success");
        expect(result.document.basics.name).toBe("Sam");
        expect(result.document.volunteer[0]).toMatchObject({
            organization: "Red Cross",
            position: "Volunteer",
            highlights: ["blood drives"]
        });
        expect(result.document.volunteer[0].id).toBeTruthy();
        expect(result.document.interests[0]).toMatchObject({
            name: "Music",
            keywords: ["piano"]
        });
        expect(result.document.meta.heron.sectionOrder).toEqual(
            expect.arrayContaining(["volunteer", "interests"])
        );
    });

    it("drops references, awards, publications, and languages", () => {
        const result = importResumeJson(
            JSON.stringify({
                basics: { name: "Sam" },
                references: [{ name: "A", reference: "Great" }],
                awards: [{ title: "Oscar" }],
                publications: [{ name: "Paper" }],
                languages: [{ language: "en" }],
                volunteer: [{ organization: "Food bank" }]
            })
        );
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error("expected success");
        expect(result.document.volunteer).toHaveLength(1);
        expect(JSON.stringify(result.document)).not.toMatch(/Oscar|Paper|"references"/);
    });

    it("round-trips meta.heron from a previous Heron export", () => {
        const result = importResumeJson(
            JSON.stringify({
                basics: { name: "Sam" },
                work: [{ id: "w1", name: "GEICO" }],
                meta: {
                    heron: {
                        hiddenSections: ["skills"],
                        condensedWorkIds: ["w1"],
                        customSections: [
                            {
                                id: "c1",
                                heading: "Talks",
                                entries: [{ id: "e1", title: "A talk", subtitle: "", detail: "", bullets: [] }]
                            }
                        ]
                    }
                }
            })
        );
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error("expected success");
        expect(result.document.meta.heron.hiddenSections).toEqual(["skills"]);
        expect(result.document.meta.heron.condensedWorkIds).toEqual(["w1"]);
        expect(result.document.meta.heron.customSections[0].heading).toBe("Talks");
    });
});
