/** Defensive parsing for the stored resume document. Mirrors the
 * `parseFrontPageConfig` contract: never throw, always return a structurally
 * valid `ResumeDocument`. */

import { createDefaultResume, STANDARD_SECTION_IDS } from "./defaults";
import type {
    Basics,
    CertificateEntry,
    CustomSection,
    CustomSectionEntry,
    EducationEntry,
    InterestGroup,
    Profile,
    ProjectEntry,
    ResumeDocument,
    ResumeMeta,
    SkillGroup,
    VolunteerEntry,
    WorkEntry
} from "./types";

function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function strArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

/** Keeps a provided id or generates one; regenerates on collision so
 * `condensedWorkIds` references stay unambiguous. */
function entryId(raw: Record<string, unknown>, seen: Set<string>): string {
    let id = str(raw.id);
    if (!id || seen.has(id)) {
        id = generateId();
    }
    seen.add(id);
    return id;
}

function sanitizeEntries<T>(
    value: unknown,
    sanitizeOne: (raw: Record<string, unknown>, seen: Set<string>) => T
): T[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value
        .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
        .map((entry) => sanitizeOne(entry as Record<string, unknown>, seen));
}

function sanitizeProfile(raw: Record<string, unknown>, seen: Set<string>): Profile {
    return {
        id: entryId(raw, seen),
        network: str(raw.network),
        username: str(raw.username),
        url: str(raw.url)
    };
}

function sanitizeBasics(value: unknown): Basics {
    const raw = asRecord(value);
    const location = asRecord(raw.location);
    return {
        name: str(raw.name),
        label: str(raw.label),
        email: str(raw.email),
        phone: str(raw.phone),
        url: str(raw.url),
        summary: str(raw.summary),
        location: { city: str(location.city), region: str(location.region) },
        profiles: sanitizeEntries(raw.profiles, sanitizeProfile)
    };
}

function sanitizeWorkEntry(raw: Record<string, unknown>, seen: Set<string>): WorkEntry {
    return {
        id: entryId(raw, seen),
        name: str(raw.name),
        position: str(raw.position),
        location: str(raw.location),
        url: str(raw.url),
        startDate: str(raw.startDate),
        endDate: str(raw.endDate),
        summary: str(raw.summary),
        highlights: strArray(raw.highlights)
    };
}

function sanitizeProjectEntry(raw: Record<string, unknown>, seen: Set<string>): ProjectEntry {
    return {
        id: entryId(raw, seen),
        name: str(raw.name),
        description: str(raw.description),
        highlights: strArray(raw.highlights),
        keywords: strArray(raw.keywords),
        url: str(raw.url),
        startDate: str(raw.startDate),
        endDate: str(raw.endDate)
    };
}

function sanitizeSkillGroup(raw: Record<string, unknown>, seen: Set<string>): SkillGroup {
    return {
        id: entryId(raw, seen),
        name: str(raw.name),
        keywords: strArray(raw.keywords)
    };
}

function sanitizeEducationEntry(raw: Record<string, unknown>, seen: Set<string>): EducationEntry {
    return {
        id: entryId(raw, seen),
        institution: str(raw.institution),
        area: str(raw.area),
        studyType: str(raw.studyType),
        startDate: str(raw.startDate),
        endDate: str(raw.endDate),
        url: str(raw.url)
    };
}

function sanitizeCertificateEntry(raw: Record<string, unknown>, seen: Set<string>): CertificateEntry {
    return {
        id: entryId(raw, seen),
        name: str(raw.name),
        date: str(raw.date),
        issuer: str(raw.issuer),
        url: str(raw.url)
    };
}

function sanitizeVolunteerEntry(raw: Record<string, unknown>, seen: Set<string>): VolunteerEntry {
    return {
        id: entryId(raw, seen),
        organization: str(raw.organization),
        position: str(raw.position),
        url: str(raw.url),
        startDate: str(raw.startDate),
        endDate: str(raw.endDate),
        summary: str(raw.summary),
        highlights: strArray(raw.highlights)
    };
}

function sanitizeInterestGroup(raw: Record<string, unknown>, seen: Set<string>): InterestGroup {
    return {
        id: entryId(raw, seen),
        name: str(raw.name),
        keywords: strArray(raw.keywords)
    };
}

function sanitizeCustomEntry(raw: Record<string, unknown>, seen: Set<string>): CustomSectionEntry {
    return {
        id: entryId(raw, seen),
        title: str(raw.title),
        subtitle: str(raw.subtitle),
        detail: str(raw.detail),
        bullets: strArray(raw.bullets)
    };
}

function sanitizeCustomSection(raw: Record<string, unknown>, seen: Set<string>): CustomSection {
    return {
        id: entryId(raw, seen),
        heading: str(raw.heading),
        entries: sanitizeEntries(raw.entries, sanitizeCustomEntry)
    };
}

/** Unknown ids are dropped; missing ids are appended (standard order first,
 * then custom sections in their stored order). */
function reconcileSectionOrder(value: unknown, customSections: CustomSection[]): string[] {
    const validIds = new Set<string>([
        ...STANDARD_SECTION_IDS,
        ...customSections.map((section) => section.id)
    ]);
    const order: string[] = [];
    if (Array.isArray(value)) {
        for (const entry of value) {
            if (typeof entry === "string" && validIds.has(entry) && !order.includes(entry)) {
                order.push(entry);
            }
        }
    }
    for (const id of validIds) {
        if (!order.includes(id)) {
            order.push(id);
        }
    }
    return order;
}

function sanitizeMeta(
    value: unknown,
    context: { workIds: Set<string> }
): ResumeMeta {
    const raw = asRecord(value);
    const heron = asRecord(raw.heron);
    const customSections = sanitizeEntries(heron.customSections, sanitizeCustomSection);
    const sectionOrder = reconcileSectionOrder(heron.sectionOrder, customSections);
    const sectionIds = new Set(sectionOrder);
    return {
        canonical: str(raw.canonical),
        version: str(raw.version) || "v1.0.0",
        lastModified: str(raw.lastModified),
        heron: {
            sectionOrder,
            hiddenSections: strArray(heron.hiddenSections).filter((id) => sectionIds.has(id)),
            condensedWorkIds: strArray(heron.condensedWorkIds).filter((id) =>
                context.workIds.has(id)
            ),
            customSections
        }
    };
}

export function sanitizeResumeDocument(raw: unknown): ResumeDocument {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return createDefaultResume();
    }
    const root = raw as Record<string, unknown>;
    const work = sanitizeEntries(root.work, sanitizeWorkEntry);
    return {
        basics: sanitizeBasics(root.basics),
        work,
        projects: sanitizeEntries(root.projects, sanitizeProjectEntry),
        skills: sanitizeEntries(root.skills, sanitizeSkillGroup),
        education: sanitizeEntries(root.education, sanitizeEducationEntry),
        certificates: sanitizeEntries(root.certificates, sanitizeCertificateEntry),
        volunteer: sanitizeEntries(root.volunteer, sanitizeVolunteerEntry),
        interests: sanitizeEntries(root.interests, sanitizeInterestGroup),
        meta: sanitizeMeta(root.meta, { workIds: new Set(work.map((entry) => entry.id)) })
    };
}

/** Never throws: unparseable or absent JSON yields the default document. */
export function parseResumeDocument(raw: string | null): ResumeDocument {
    if (!raw) return createDefaultResume();
    try {
        return sanitizeResumeDocument(JSON.parse(raw));
    } catch {
        return createDefaultResume();
    }
}
