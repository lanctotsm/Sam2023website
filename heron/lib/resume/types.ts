/** Resume document types. The canonical shape is JSON Resume v1.0.0 with
 * Heron-specific data quarantined under `meta.heron`. */

export type ResumeDocument = {
    basics: Basics;
    work: WorkEntry[];
    projects: ProjectEntry[];
    skills: SkillGroup[];
    education: EducationEntry[];
    certificates: CertificateEntry[];
    meta: ResumeMeta;
};

export type Basics = {
    name: string;
    label: string;
    email: string;
    /** Blank omits the phone everywhere — page, PDF, and export. */
    phone: string;
    url: string;
    summary: string;
    location: { city: string; region: string };
    profiles: Profile[];
};

export type Profile = {
    id: string;
    network: string;
    username: string;
    url: string;
};

export type WorkEntry = {
    id: string;
    /** Company name (JSON Resume calls this `name`). */
    name: string;
    position: string;
    location: string;
    url: string;
    /** ISO8601 partial date, e.g. "2019-08". */
    startDate: string;
    /** Empty string means "present". */
    endDate: string;
    summary: string;
    highlights: string[];
};

export type ProjectEntry = {
    id: string;
    name: string;
    description: string;
    highlights: string[];
    keywords: string[];
    url: string;
    startDate: string;
    endDate: string;
};

export type SkillGroup = {
    id: string;
    name: string;
    keywords: string[];
};

export type EducationEntry = {
    id: string;
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    url: string;
};

export type CertificateEntry = {
    id: string;
    name: string;
    date: string;
    issuer: string;
    url: string;
};

export type CustomSectionEntry = {
    id: string;
    title: string;
    subtitle: string;
    detail: string;
    bullets: string[];
};

export type CustomSection = {
    id: string;
    heading: string;
    entries: CustomSectionEntry[];
};

export type ResumeMeta = {
    canonical: string;
    version: string;
    /** ISO8601 timestamp, stamped on save. */
    lastModified: string;
    heron: {
        /** Section ids — standard and custom interleaved. */
        sectionOrder: string[];
        hiddenSections: string[];
        condensedWorkIds: string[];
        customSections: CustomSection[];
    };
};
