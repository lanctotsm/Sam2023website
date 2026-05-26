/** Homepage sections stored as rows in `front_page` settings JSON. */

import {
    HOME_SECTION_TEMPLATE_DEFS,
    HOME_SECTION_TEMPLATE_IDS,
    getTemplateLabel,
    resolveTemplateId,
    sanitizeTemplateData,
    type HomeSectionTemplateData,
    type HomeSectionTemplateId,
} from "./homeSectionTemplates";

export type { HomeSectionTemplateId, HomeSectionTemplateData } from "./homeSectionTemplates";
export type {
    BannerSectionData,
    TextBlockSectionData,
    CardGridSectionData,
    TagListSectionData,
    ContactSectionData,
    CardItem,
    TagItem,
    ContactLink,
} from "./homeSectionTemplates/types";

export { HOME_SECTION_TEMPLATE_IDS, HOME_SECTION_TEMPLATE_DEFS, getTemplateLabel } from "./homeSectionTemplates";

/** A single home page section row (template + data), stored in the DB. */
export type HomeSection = {
    id: string;
    templateId: HomeSectionTemplateId;
    label: string;
    removable?: boolean;
    data: HomeSectionTemplateData;
};

export type FrontPageSettings = {
    sections: HomeSection[];
    sectionOrder: string[];
};

export function newSectionId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `s${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSectionDisplayLabel(section: HomeSection): string {
    if (section.templateId === "text-block") {
        const heading = (section.data as { heading?: string }).heading?.trim();
        if (heading) return heading;
    }
    return section.label.trim() || getTemplateLabel(section.templateId);
}

export function findSection(config: FrontPageSettings, id: string): HomeSection | undefined {
    return config.sections.find((s) => s.id === id);
}

function buildDefaultSections(): HomeSection[] {
    return [
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a01",
            templateId: "banner",
            label: "Top banner",
            data: {
                title: "Samuel Lanctot",
                subtitle:
                    "Developer, creator, and lifelong learner passionate about building meaningful experiences through technology and art.",
                backgroundType: "gradient",
                backgroundColor: "#6B2D2D",
                backgroundImage: "",
                gradientFrom: "",
                gradientTo: "",
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a02",
            templateId: "text-block",
            label: "About",
            data: {
                heading: "About Me",
                paragraphs: [
                    "Hello! My name is Sam Lanctot, I'm a software engineer in the DC metro area. Currently I'm employed at GEICO as a Senior Software Engineer working on commercial software dealing with DuckCreek and Next.js based service applications.",
                    "I have 7 years experience in full stack .NET development and 2 years experience in Node.js/Python/Scala development. My journey began with a fascination for how things work, which evolved into a passion for building solutions that matter.",
                    "My hobbies include photography, Magic the Gathering, Dungeons & Dragons, and video games. I also enjoy traveling especially by train. I live in Silver Spring with my wife Caitlin and our two wonderful cats, Catniss and Byron.",
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a03",
            templateId: "card-grid",
            label: "What I do",
            data: {
                heading: "What I Do",
                columns: 2,
                items: [
                    {
                        icon: "Monitor",
                        title: "Software Development",
                        text: "Building robust applications with modern technologies. From backend systems to responsive frontends, I enjoy crafting elegant solutions to complex problems.",
                    },
                    {
                        icon: "Camera",
                        title: "Photography",
                        text: "Capturing moments and telling stories through the lens. I'm drawn to landscapes, street photography, and the quiet beauty of everyday life.",
                    },
                    {
                        icon: "Palette",
                        title: "Creative Projects",
                        text: "Exploring the boundaries between art and technology. Whether it's generative art, interactive installations, or digital experiments, I love pushing creative limits.",
                    },
                    {
                        icon: "BookOpen",
                        title: "Continuous Learning",
                        text: "Always expanding my horizons through books, courses, and hands-on experimentation. The tech landscape is ever-evolving, and I aim to evolve with it.",
                    },
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a04",
            templateId: "text-block",
            label: "Journey",
            data: {
                heading: "My Journey",
                paragraphs: [
                    "My path has been anything but linear—and I wouldn't have it any other way. What started as tinkering with computers in my youth has grown into a fulfilling career building software that people actually use. Along the way, I've had the privilege of working with talented teams, tackling interesting challenges, and continuously refining my craft.",
                    "I've learned that the most rewarding work happens at the intersection of passion and purpose. Whether I'm debugging a tricky issue at 2 AM or capturing the perfect golden hour shot, the common thread is the joy of creating something meaningful.",
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a05",
            templateId: "tag-list",
            label: "Interests",
            data: {
                heading: "Beyond the Screen",
                items: [
                    { icon: "Mountain", label: "Hiking & Nature" },
                    { icon: "Coffee", label: "Coffee Culture" },
                    { icon: "Music", label: "Music Discovery" },
                    { icon: "BookOpen", label: "Science Fiction" },
                    { icon: "Gamepad2", label: "Indie Games" },
                    { icon: "Plane", label: "Travel" },
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a06",
            templateId: "contact",
            label: "Contact",
            data: {
                heading: "Let's Connect",
                text: "I'm always open to interesting conversations, collaboration opportunities, or just saying hello. Whether you have a project in mind, want to discuss photography, or simply want to chat about the latest in tech—feel free to reach out.",
                showSocials: true,
                links: [
                    { icon: "Mail", label: "Email", url: "mailto:lanctotsm@gmail.com" },
                    { icon: "Github", label: "GitHub", url: "https://github.com/samlanctot" },
                    {
                        icon: "Briefcase",
                        label: "LinkedIn",
                        url: "https://www.linkedin.com/in/samuel-lanctot/",
                    },
                    { icon: "FileText", label: "Resume", url: "/resume" },
                ],
            },
        },
    ];
}

export function createDefaultFrontPageConfig(): FrontPageSettings {
    const sections = buildDefaultSections();
    return { sections, sectionOrder: sections.map((s) => s.id) };
}

export const defaultFrontPage = createDefaultFrontPageConfig();

export function createHomeSection(templateId: HomeSectionTemplateId, label?: string): HomeSection {
    const def = HOME_SECTION_TEMPLATE_DEFS[templateId];
    return {
        id: newSectionId(),
        templateId,
        label: label ?? def.label,
        removable: true,
        data: def.defaultData(),
    };
}

export function createTextBlockSection(heading = "New Section"): HomeSection {
    return {
        ...createHomeSection("text-block", heading),
        data: { heading, paragraphs: [""] },
    };
}

function defaultDataForTemplate(templateId: HomeSectionTemplateId): HomeSectionTemplateData {
    const template = defaultFrontPage.sections.find((s) => s.templateId === templateId);
    if (template) return structuredClone(template.data);
    return HOME_SECTION_TEMPLATE_DEFS[templateId].defaultData();
}

function sanitizeHomeSection(raw: unknown, fallback?: HomeSection): HomeSection | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    const templateId = resolveTemplateId(r.templateId ?? r.type);
    if (!id || !templateId) return null;

    const label =
        typeof r.label === "string" && r.label.length > 0
            ? r.label
            : (fallback?.label ?? getTemplateLabel(templateId));
    const removable = typeof r.removable === "boolean" ? r.removable : fallback?.removable;
    const dataFallback = fallback?.data ?? defaultDataForTemplate(templateId);

    return {
        id,
        templateId,
        label,
        removable,
        data: sanitizeTemplateData(templateId, r.data, dataFallback),
    };
}

function sanitizeSections(value: unknown): HomeSection[] {
    if (!Array.isArray(value)) return defaultFrontPage.sections.map((s) => structuredClone(s));
    const defaultsById = new Map(defaultFrontPage.sections.map((s) => [s.id, s]));
    const sections: HomeSection[] = [];
    for (const entry of value) {
        const fallback = defaultsById.get((entry as HomeSection)?.id ?? "");
        const section = sanitizeHomeSection(entry, fallback);
        if (section && !sections.some((s) => s.id === section.id)) {
            sections.push(section);
        }
    }
    return sections.length > 0 ? sections : defaultFrontPage.sections.map((s) => structuredClone(s));
}

function sanitizeSectionOrder(value: unknown, sectionIds: Set<string>): string[] {
    const defaultOrder = defaultFrontPage.sectionOrder;
    if (!Array.isArray(value)) return [...defaultOrder];
    const order: string[] = [];
    for (const entry of value) {
        if (typeof entry !== "string" || entry.length === 0) continue;
        const id = entry.startsWith("custom:") ? entry.slice("custom:".length) : entry;
        if (sectionIds.has(id) && !order.includes(id)) {
            order.push(id);
        }
    }
    return order.length > 0 ? order : [...defaultOrder];
}

export function parseFrontPageConfig(raw: string | null): FrontPageSettings {
    if (!raw) return createDefaultFrontPageConfig();
    try {
        const parsed = JSON.parse(raw);
        const root = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
        if (!Array.isArray(root.sections)) {
            return createDefaultFrontPageConfig();
        }
        const sections = sanitizeSections(root.sections);
        const sectionIds = new Set(sections.map((s) => s.id));
        const sectionOrder = sanitizeSectionOrder(root.sectionOrder, sectionIds);
        return { sections, sectionOrder };
    } catch {
        return createDefaultFrontPageConfig();
    }
}

export function getDefaultFrontPageJson(): string {
    return JSON.stringify(createDefaultFrontPageConfig());
}
