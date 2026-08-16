import type { ResumeDocument } from "./types";

export const STANDARD_SECTION_IDS = [
    "work",
    "projects",
    "skills",
    "education",
    "certificates"
] as const;

export type StandardSectionId = (typeof STANDARD_SECTION_IDS)[number];

export const SECTION_LABELS: Record<StandardSectionId, string> = {
    work: "Experience",
    projects: "Projects",
    skills: "Skills",
    education: "Education",
    certificates: "Certifications"
};

export function isStandardSectionId(id: string): id is StandardSectionId {
    return (STANDARD_SECTION_IDS as readonly string[]).includes(id);
}

/** Empty skeleton — no seeded content; the resume is entered through the admin UI. */
export function createDefaultResume(): ResumeDocument {
    return {
        basics: {
            name: "",
            label: "",
            email: "",
            phone: "",
            url: "",
            summary: "",
            location: { city: "", region: "" },
            profiles: []
        },
        work: [],
        projects: [],
        skills: [],
        education: [],
        certificates: [],
        meta: {
            canonical: "",
            version: "v1.0.0",
            lastModified: "",
            heron: {
                sectionOrder: [...STANDARD_SECTION_IDS],
                hiddenSections: [],
                condensedWorkIds: [],
                customSections: []
            }
        }
    };
}
