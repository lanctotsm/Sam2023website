import { describe, it, expect } from "vitest";
import { toPersonJsonLd } from "./jsonLd";
import { sanitizeResumeDocument } from "./parse";
import { createDefaultResume } from "./defaults";

const BASE = "https://samlanctot.com";

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
            profiles: [
                { id: "p1", network: "GitHub", username: "sam", url: "https://github.com/sam" },
                { id: "p2", network: "LinkedIn", username: "sam", url: "https://linkedin.com/in/sam" }
            ]
        },
        work: [
            { id: "w1", name: "Old Co", startDate: "2015-01", endDate: "2019-05" },
            { id: "w2", name: "GEICO", url: "https://geico.com", startDate: "2021-06", endDate: "" }
        ],
        education: [{ id: "e1", institution: "UMD", area: "CE", studyType: "B.S." }],
        skills: [
            { id: "s1", name: "Primary", keywords: ["TypeScript", "C#"] },
            { id: "s2", name: "Cloud", keywords: ["AWS"] }
        ],
        certificates: [{ id: "c1", name: "AWS SA", issuer: "Amazon", date: "2023-01-01" }]
    });
}

describe("lib/resume/jsonLd", () => {
    it("emits correct @context and @type", () => {
        const ld = toPersonJsonLd(sampleDoc(), BASE);
        expect(ld["@context"]).toBe("https://schema.org");
        expect(ld["@type"]).toBe("Person");
    });

    it("resolves worksFor to the work entry with an empty endDate", () => {
        const ld = toPersonJsonLd(sampleDoc(), BASE) as { worksFor: { "@type": string; name: string } };
        expect(ld.worksFor).toMatchObject({ "@type": "Organization", name: "GEICO" });
    });

    it("omits telephone when the phone is blank and formats email as mailto", () => {
        const ld = toPersonJsonLd(sampleDoc(), BASE);
        expect(ld).not.toHaveProperty("telephone");
        expect(ld.email).toBe("mailto:sam@example.com");
    });

    it("maps profiles to sameAs, skills to knowsAbout, education and certificates", () => {
        const ld = toPersonJsonLd(sampleDoc(), BASE) as {
            sameAs: string[];
            knowsAbout: string[];
            alumniOf: Array<Record<string, unknown>>;
            hasCredential: Array<Record<string, unknown>>;
        };
        expect(ld.sameAs).toEqual(["https://github.com/sam", "https://linkedin.com/in/sam"]);
        expect(ld.knowsAbout).toEqual(["TypeScript", "C#", "AWS"]);
        expect(ld.alumniOf[0]).toMatchObject({ "@type": "EducationalOrganization", name: "UMD" });
        expect(ld.hasCredential[0]).toMatchObject({
            "@type": "EducationalOccupationalCredential",
            name: "AWS SA"
        });
    });

    it("adds interest keywords to knowsAbout when the interests section is visible", () => {
        const doc = sampleDoc();
        doc.interests = [{ id: "i1", name: "Music", keywords: ["piano"] }];
        const ld = toPersonJsonLd(doc, BASE) as { knowsAbout: string[] };
        expect(ld.knowsAbout).toEqual(["TypeScript", "C#", "AWS", "piano"]);
    });

    it("omits sections listed in meta.heron.hiddenSections from JSON-LD", () => {
        const doc = sampleDoc();
        doc.meta.heron.hiddenSections = ["work", "education", "skills", "interests", "certificates"];
        const ld = toPersonJsonLd(doc, BASE);
        expect(ld).not.toHaveProperty("worksFor");
        expect(ld).not.toHaveProperty("alumniOf");
        expect(ld).not.toHaveProperty("knowsAbout");
        expect(ld).not.toHaveProperty("hasCredential");
    });

    it("omits only the hidden sections, leaving visible sections in JSON-LD", () => {
        const doc = sampleDoc();
        doc.meta.heron.hiddenSections = ["skills", "certificates"];
        const ld = toPersonJsonLd(doc, BASE) as {
            worksFor?: unknown;
            alumniOf?: unknown;
            knowsAbout?: unknown;
            hasCredential?: unknown;
        };
        expect(ld.worksFor).toBeDefined();
        expect(ld.alumniOf).toBeDefined();
        expect(ld).not.toHaveProperty("knowsAbout");
        expect(ld).not.toHaveProperty("hasCredential");
    });

    it("produces minimal valid JSON-LD for an empty document without throwing", () => {
        const ld = toPersonJsonLd(createDefaultResume(), BASE);
        expect(ld["@type"]).toBe("Person");
        expect(ld).not.toHaveProperty("worksFor");
        expect(ld).not.toHaveProperty("email");
        expect(() => JSON.stringify(ld)).not.toThrow();
    });
});
