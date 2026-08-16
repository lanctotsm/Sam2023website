/** Shapes the stored document into a clean JSON Resume v1.0.0 export.
 * Empty optional fields are dropped; `meta.heron` and entry ids are retained
 * so the export is a faithful, importable round trip. */

import type { ResumeDocument } from "./types";

/** Removes keys whose value is an empty string or empty array, except keys
 * listed in `keep` (e.g. `endDate`, whose empty string means "present"). */
function prune(
    entry: Record<string, unknown>,
    keep: readonly string[] = []
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entry)) {
        if (keep.includes(key)) {
            out[key] = value;
            continue;
        }
        if (typeof value === "string" && value === "") continue;
        if (Array.isArray(value) && value.length === 0) continue;
        out[key] = value;
    }
    return out;
}

/** Expands a partial `YYYY-MM` date to the full `YYYY-MM-DD` format required by
 * JSON Resume v1.0.0.  Already-complete dates and blank values pass through. */
function normalizeCertDate(value: string): string {
    if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
    return value;
}

export function toJsonResume(
    doc: ResumeDocument,
    options: { canonical?: string } = {}
): Record<string, unknown> {
    const basics = prune({
        name: doc.basics.name,
        label: doc.basics.label,
        email: doc.basics.email,
        phone: doc.basics.phone,
        url: doc.basics.url,
        summary: doc.basics.summary,
        profiles: doc.basics.profiles.map((profile) => prune({ ...profile }))
    });
    const location = prune({
        city: doc.basics.location.city,
        region: doc.basics.location.region
    });
    if (Object.keys(location).length > 0) {
        basics.location = location;
    }

    const out: Record<string, unknown> = { basics };

    const work = doc.work.map((entry) => prune({ ...entry }));
    if (work.length > 0) out.work = work;

    const projects = doc.projects.map((entry) => prune({ ...entry }));
    if (projects.length > 0) out.projects = projects;

    const skills = doc.skills.map((entry) => prune({ ...entry }));
    if (skills.length > 0) out.skills = skills;

    const education = doc.education.map((entry) => prune({ ...entry }));
    if (education.length > 0) out.education = education;

    const certificates = doc.certificates.map((entry) =>
        prune({ ...entry, date: normalizeCertDate(entry.date) })
    );
    if (certificates.length > 0) out.certificates = certificates;

    out.meta = prune({
        canonical: options.canonical ?? doc.meta.canonical,
        version: doc.meta.version || "v1.0.0",
        lastModified: doc.meta.lastModified,
        heron: structuredClone(doc.meta.heron)
    });

    return out;
}
