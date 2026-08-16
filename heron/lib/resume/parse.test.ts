import { describe, it, expect } from "vitest";
import { parseResumeDocument, sanitizeResumeDocument } from "./parse";
import { createDefaultResume, STANDARD_SECTION_IDS } from "./defaults";

describe("lib/resume/parse", () => {
    it("returns the default document for null input", () => {
        expect(parseResumeDocument(null)).toEqual(createDefaultResume());
    });

    it("returns the default document for malformed JSON", () => {
        expect(parseResumeDocument("{not json")).toEqual(createDefaultResume());
    });

    it("returns the default document for non-object JSON", () => {
        expect(parseResumeDocument("[1,2,3]")).toEqual(createDefaultResume());
        expect(parseResumeDocument('"hello"')).toEqual(createDefaultResume());
    });

    it("coerces missing and wrongly-typed string fields to empty strings", () => {
        const doc = sanitizeResumeDocument({
            basics: { name: 42, label: null, email: "  a@b.c  ", location: "nope" }
        });
        expect(doc.basics.name).toBe("");
        expect(doc.basics.label).toBe("");
        expect(doc.basics.email).toBe("a@b.c");
        expect(doc.basics.location).toEqual({ city: "", region: "" });
    });

    it("coerces non-array collection fields to empty arrays", () => {
        const doc = sanitizeResumeDocument({ work: "nope", skills: { a: 1 } });
        expect(doc.work).toEqual([]);
        expect(doc.skills).toEqual([]);
    });

    it("generates ids for entries that lack one and dedupes duplicates", () => {
        const doc = sanitizeResumeDocument({
            work: [
                { name: "Acme", position: "Dev", highlights: ["did things"] },
                { id: "w1", name: "B" },
                { id: "w1", name: "C" }
            ]
        });
        expect(doc.work).toHaveLength(3);
        expect(doc.work[0].id).toBeTruthy();
        expect(doc.work[1].id).toBe("w1");
        expect(doc.work[2].id).not.toBe("w1");
        expect(doc.work[2].id).toBeTruthy();
    });

    it("coerces non-array highlights to an empty array and drops non-string bullets", () => {
        const doc = sanitizeResumeDocument({
            work: [
                { id: "w1", name: "Acme", highlights: "one big string" },
                { id: "w2", name: "Beta", highlights: ["keep", 7, null, "  also keep  ", ""] }
            ]
        });
        expect(doc.work[0].highlights).toEqual([]);
        expect(doc.work[1].highlights).toEqual(["keep", "also keep"]);
    });

    it("drops unknown ids from sectionOrder and appends missing ones", () => {
        const doc = sanitizeResumeDocument({
            meta: { heron: { sectionOrder: ["skills", "bogus", "work"] } }
        });
        expect(doc.meta.heron.sectionOrder.slice(0, 2)).toEqual(["skills", "work"]);
        expect([...doc.meta.heron.sectionOrder].sort()).toEqual([...STANDARD_SECTION_IDS].sort());
    });

    it("includes custom section ids in sectionOrder reconciliation", () => {
        const doc = sanitizeResumeDocument({
            meta: {
                heron: {
                    sectionOrder: ["c1", "work"],
                    customSections: [{ id: "c1", heading: "Talks", entries: [] }]
                }
            }
        });
        expect(doc.meta.heron.sectionOrder[0]).toBe("c1");
        expect(doc.meta.heron.sectionOrder).toContain("education");
    });

    it("keeps section entries when the section is hidden — hide is a flag, not a delete", () => {
        const doc = sanitizeResumeDocument({
            work: [{ id: "w1", name: "GEICO", position: "Engineer" }],
            skills: [{ id: "s1", name: "Primary", keywords: ["TypeScript"] }],
            meta: { heron: { hiddenSections: ["work"] } }
        });
        expect(doc.meta.heron.hiddenSections).toEqual(["work"]);
        expect(doc.work).toEqual([
            expect.objectContaining({ id: "w1", name: "GEICO", position: "Engineer" })
        ]);
        expect(doc.skills[0].keywords).toEqual(["TypeScript"]);
    });

    it("filters condensedWorkIds and hiddenSections to ids that resolve", () => {
        const doc = sanitizeResumeDocument({
            work: [{ id: "w1", name: "Acme" }],
            meta: {
                heron: {
                    condensedWorkIds: ["w1", "ghost"],
                    hiddenSections: ["projects", "nope"]
                }
            }
        });
        expect(doc.meta.heron.condensedWorkIds).toEqual(["w1"]);
        expect(doc.meta.heron.hiddenSections).toEqual(["projects"]);
    });

    it("is idempotent: re-parsing serialized output is a fixed point", () => {
        const doc = sanitizeResumeDocument({
            basics: { name: "Sam", profiles: [{ network: "GitHub", url: "https://g" }] },
            work: [{ name: "Acme", highlights: ["x"], endDate: "" }],
            skills: [{ name: "Primary", keywords: ["ts"] }],
            meta: {
                heron: {
                    sectionOrder: ["skills"],
                    customSections: [{ heading: "Talks", entries: [{ title: "A talk" }] }]
                }
            }
        });
        const reparsed = parseResumeDocument(JSON.stringify(doc));
        expect(reparsed).toEqual(doc);
    });
});
