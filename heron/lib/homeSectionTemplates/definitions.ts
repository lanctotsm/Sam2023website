import type {
    BannerSectionData,
    CardGridSectionData,
    CardItem,
    ContactLink,
    ContactSectionData,
    HomeSectionTemplateData,
    HomeSectionTemplateId,
    TagItem,
    TagListSectionData,
    TextBlockSectionData,
} from "./types";

export type HomeSectionTemplateDefinition = {
    id: HomeSectionTemplateId;
    /** Admin UI label when the section row has no custom label. */
    label: string;
    description: string;
    defaultData: () => HomeSectionTemplateData;
    sanitize: (raw: unknown, fallback: HomeSectionTemplateData) => HomeSectionTemplateData;
};

export const HOME_SECTION_TEMPLATE_DEFS: Record<HomeSectionTemplateId, HomeSectionTemplateDefinition> = {
    banner: {
        id: "banner",
        label: "Top banner",
        description: "Large intro block at the top of the home page.",
        defaultData: () => ({
            title: "",
            subtitle: "",
            backgroundType: "gradient",
            backgroundColor: "",
            backgroundImage: "",
            gradientFrom: "",
            gradientTo: "",
        }),
        sanitize: (raw, fb) => sanitizeBannerData(raw, fb as BannerSectionData),
    },
    "text-block": {
        id: "text-block",
        label: "Text block",
        description: "Heading with one or more paragraphs.",
        defaultData: () => ({ heading: "Text block", paragraphs: [""] }),
        sanitize: (raw, fb) => sanitizeTextBlockData(raw, fb as TextBlockSectionData),
    },
    "card-grid": {
        id: "card-grid",
        label: "Card grid",
        description: "Grid of icon cards with title and description.",
        defaultData: () => ({ heading: "Card grid", columns: 2, items: [] }),
        sanitize: (raw, fb) => sanitizeCardGridData(raw, fb as CardGridSectionData),
    },
    "tag-list": {
        id: "tag-list",
        label: "Tag list",
        description: "Pill-style list of labeled icons.",
        defaultData: () => ({ heading: "Tag list", items: [] }),
        sanitize: (raw, fb) => sanitizeTagListData(raw, fb as TagListSectionData),
    },
    contact: {
        id: "contact",
        label: "Contact",
        description: "Contact blurb with optional social links.",
        defaultData: () => ({
            heading: "Contact",
            text: "",
            showSocials: true,
            links: [],
        }),
        sanitize: (raw, fb) => sanitizeContactData(raw, fb as ContactSectionData),
    },
};

export const HOME_SECTION_TEMPLATE_IDS = Object.keys(
    HOME_SECTION_TEMPLATE_DEFS
) as HomeSectionTemplateId[];

/** Maps stored JSON from older saves (`type` / camelCase ids) to current template ids. */
export const LEGACY_TEMPLATE_ID_MAP: Record<string, HomeSectionTemplateId> = {
    hero: "banner",
    textBlock: "text-block",
    cards: "card-grid",
    interests: "tag-list",
    contact: "contact",
};

export function resolveTemplateId(raw: unknown): HomeSectionTemplateId | null {
    if (typeof raw !== "string" || raw.length === 0) return null;
    if (raw in HOME_SECTION_TEMPLATE_DEFS) return raw as HomeSectionTemplateId;
    return LEGACY_TEMPLATE_ID_MAP[raw] ?? null;
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sanitizeStringArray(value: unknown, fallback: string[]): string[] {
    return isStringArray(value) ? value : fallback;
}

function sanitizeCardItems(value: unknown, fallback: CardItem[]): CardItem[] {
    if (!Array.isArray(value)) return fallback;
    const items: CardItem[] = [];
    for (const item of value) {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as CardItem).icon === "string" &&
            typeof (item as CardItem).title === "string" &&
            typeof (item as CardItem).text === "string"
        ) {
            items.push({
                icon: (item as CardItem).icon,
                title: (item as CardItem).title,
                text: (item as CardItem).text,
            });
        }
    }
    return items.length > 0 ? items : fallback;
}

function sanitizeTagItems(value: unknown, fallback: TagItem[]): TagItem[] {
    if (!Array.isArray(value)) return fallback;
    const items: TagItem[] = [];
    for (const item of value) {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as TagItem).icon === "string" &&
            typeof (item as TagItem).label === "string"
        ) {
            items.push({
                icon: (item as TagItem).icon,
                label: (item as TagItem).label,
            });
        }
    }
    return items.length > 0 ? items : fallback;
}

function sanitizeContactLinks(value: unknown, fallback: ContactLink[]): ContactLink[] {
    if (!Array.isArray(value)) return fallback;
    const links: ContactLink[] = [];
    for (const item of value) {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as ContactLink).icon === "string" &&
            typeof (item as ContactLink).label === "string" &&
            typeof (item as ContactLink).url === "string"
        ) {
            links.push({
                icon: (item as ContactLink).icon,
                label: (item as ContactLink).label,
                url: (item as ContactLink).url,
            });
        }
    }
    return links.length > 0 ? links : fallback;
}

function sanitizeBannerData(raw: unknown, fallback: BannerSectionData): BannerSectionData {
    if (!raw || typeof raw !== "object") return { ...fallback };
    const r = raw as Record<string, unknown>;
    const bg =
        r.backgroundType === "gradient" || r.backgroundType === "color" || r.backgroundType === "image"
            ? r.backgroundType
            : fallback.backgroundType;
    return {
        title: typeof r.title === "string" ? r.title : fallback.title,
        subtitle: typeof r.subtitle === "string" ? r.subtitle : fallback.subtitle,
        backgroundType: bg,
        backgroundColor: typeof r.backgroundColor === "string" ? r.backgroundColor : fallback.backgroundColor,
        backgroundImage: typeof r.backgroundImage === "string" ? r.backgroundImage : fallback.backgroundImage,
        gradientFrom: typeof r.gradientFrom === "string" ? r.gradientFrom : fallback.gradientFrom,
        gradientTo: typeof r.gradientTo === "string" ? r.gradientTo : fallback.gradientTo,
    };
}

function sanitizeTextBlockData(raw: unknown, fallback: TextBlockSectionData): TextBlockSectionData {
    if (!raw || typeof raw !== "object") return { ...fallback };
    const r = raw as Record<string, unknown>;
    return {
        heading: typeof r.heading === "string" ? r.heading : fallback.heading,
        paragraphs: sanitizeStringArray(r.paragraphs, fallback.paragraphs),
    };
}

function sanitizeCardGridData(raw: unknown, fallback: CardGridSectionData): CardGridSectionData {
    if (!raw || typeof raw !== "object") return { ...fallback };
    const r = raw as Record<string, unknown>;
    const columns = typeof r.columns === "number" && r.columns >= 1 && r.columns <= 4 ? r.columns : fallback.columns;
    return {
        heading: typeof r.heading === "string" ? r.heading : fallback.heading,
        columns,
        items: sanitizeCardItems(r.items, fallback.items),
    };
}

function sanitizeTagListData(raw: unknown, fallback: TagListSectionData): TagListSectionData {
    if (!raw || typeof raw !== "object") return { ...fallback };
    const r = raw as Record<string, unknown>;
    return {
        heading: typeof r.heading === "string" ? r.heading : fallback.heading,
        items: sanitizeTagItems(r.items, fallback.items),
    };
}

function sanitizeContactData(raw: unknown, fallback: ContactSectionData): ContactSectionData {
    if (!raw || typeof raw !== "object") return { ...fallback };
    const r = raw as Record<string, unknown>;
    return {
        heading: typeof r.heading === "string" ? r.heading : fallback.heading,
        text: typeof r.text === "string" ? r.text : fallback.text,
        showSocials: typeof r.showSocials === "boolean" ? r.showSocials : fallback.showSocials,
        links: sanitizeContactLinks(r.links, fallback.links),
    };
}

export function sanitizeTemplateData(
    templateId: HomeSectionTemplateId,
    raw: unknown,
    fallback?: HomeSectionTemplateData
): HomeSectionTemplateData {
    const def = HOME_SECTION_TEMPLATE_DEFS[templateId];
    const base = fallback ?? def.defaultData();
    return def.sanitize(raw, base);
}

export function getTemplateLabel(templateId: HomeSectionTemplateId): string {
    return HOME_SECTION_TEMPLATE_DEFS[templateId].label;
}
