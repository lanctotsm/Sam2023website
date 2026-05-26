/** Homepage sections stored as rows in `front_page` settings JSON. */

export type HomeSectionType = "hero" | "textBlock" | "cards" | "interests" | "contact";

export const HOME_SECTION_TYPES: readonly HomeSectionType[] = [
    "hero",
    "textBlock",
    "cards",
    "interests",
    "contact",
];

/** Labels for creating a new section of a given type (not tied to specific DB rows). */
export const SECTION_TYPE_LABELS: Record<HomeSectionType, string> = {
    hero: "Hero",
    textBlock: "Text block",
    cards: "Cards",
    interests: "Interests",
    contact: "Contact",
};

export type HeroSectionData = {
    title: string;
    subtitle: string;
    backgroundType: "gradient" | "color" | "image";
    backgroundColor: string;
    backgroundImage: string;
    gradientFrom: string;
    gradientTo: string;
};

export type TextBlockSectionData = {
    heading: string;
    paragraphs: string[];
};

export type CardItem = {
    icon: string;
    title: string;
    text: string;
};

export type CardsSectionData = {
    heading: string;
    columns: number;
    items: CardItem[];
};

export type InterestItem = {
    icon: string;
    label: string;
};

export type InterestsSectionData = {
    heading: string;
    items: InterestItem[];
};

export type ContactLink = {
    icon: string;
    label: string;
    url: string;
};

export type ContactSectionData = {
    heading: string;
    text: string;
    showSocials: boolean;
    links: ContactLink[];
};

export type HomeSection =
    | { id: string; type: "hero"; label: string; removable?: boolean; data: HeroSectionData }
    | { id: string; type: "textBlock"; label: string; removable?: boolean; data: TextBlockSectionData }
    | { id: string; type: "cards"; label: string; removable?: boolean; data: CardsSectionData }
    | { id: string; type: "interests"; label: string; removable?: boolean; data: InterestsSectionData }
    | { id: string; type: "contact"; label: string; removable?: boolean; data: ContactSectionData };

export type FrontPageSettings = {
    sections: HomeSection[];
    /** Section ids currently visible on the home page, in display order. */
    sectionOrder: string[];
};

export function newSectionId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `s${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSectionDisplayLabel(section: HomeSection): string {
    if (section.type === "textBlock") {
        const heading = section.data.heading?.trim();
        if (heading) return heading;
    }
    return section.label.trim() || SECTION_TYPE_LABELS[section.type];
}

export function findSection(config: FrontPageSettings, id: string): HomeSection | undefined {
    return config.sections.find((s) => s.id === id);
}

export function sectionsById(config: FrontPageSettings): Map<string, HomeSection> {
    return new Map(config.sections.map((s) => [s.id, s]));
}

function buildDefaultSections(): HomeSection[] {
    return [
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a01",
            type: "hero",
            label: "Hero",
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
            type: "textBlock",
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
            type: "cards",
            label: "Cards",
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
            type: "textBlock",
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
            type: "interests",
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
            type: "contact",
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
    return {
        sections,
        sectionOrder: sections.map((s) => s.id),
    };
}

export const defaultFrontPage = createDefaultFrontPageConfig();

export function createTextBlockSection(heading = "New Section"): HomeSection {
    return {
        id: newSectionId(),
        type: "textBlock",
        label: heading,
        removable: true,
        data: { heading, paragraphs: [""] },
    };
}

export function emptySectionData(type: HomeSectionType): HomeSection["data"] {
    switch (type) {
        case "hero":
            return {
                title: "",
                subtitle: "",
                backgroundType: "gradient",
                backgroundColor: "",
                backgroundImage: "",
                gradientFrom: "",
                gradientTo: "",
            };
        case "textBlock":
            return { heading: SECTION_TYPE_LABELS.textBlock, paragraphs: [""] };
        case "cards":
            return { heading: SECTION_TYPE_LABELS.cards, columns: 2, items: [] };
        case "interests":
            return { heading: SECTION_TYPE_LABELS.interests, items: [] };
        case "contact":
            return {
                heading: SECTION_TYPE_LABELS.contact,
                text: "",
                showSocials: true,
                links: [],
            };
    }
}

export function createHomeSection(type: HomeSectionType, label?: string): HomeSection {
    const resolvedLabel = label ?? SECTION_TYPE_LABELS[type];
    return {
        id: newSectionId(),
        type,
        label: resolvedLabel,
        removable: true,
        data: emptySectionData(type),
    } as HomeSection;
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

function sanitizeInterestItems(value: unknown, fallback: InterestItem[]): InterestItem[] {
    if (!Array.isArray(value)) return fallback;
    const items: InterestItem[] = [];
    for (const item of value) {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as InterestItem).icon === "string" &&
            typeof (item as InterestItem).label === "string"
        ) {
            items.push({
                icon: (item as InterestItem).icon,
                label: (item as InterestItem).label,
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

function sanitizeHeroData(raw: unknown, fallback: HeroSectionData): HeroSectionData {
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

function sanitizeCardsData(raw: unknown, fallback: CardsSectionData): CardsSectionData {
    if (!raw || typeof raw !== "object") return { ...fallback };
    const r = raw as Record<string, unknown>;
    const columns = typeof r.columns === "number" && r.columns >= 1 && r.columns <= 4 ? r.columns : fallback.columns;
    return {
        heading: typeof r.heading === "string" ? r.heading : fallback.heading,
        columns,
        items: sanitizeCardItems(r.items, fallback.items),
    };
}

function sanitizeInterestsData(raw: unknown, fallback: InterestsSectionData): InterestsSectionData {
    if (!raw || typeof raw !== "object") return { ...fallback };
    const r = raw as Record<string, unknown>;
    return {
        heading: typeof r.heading === "string" ? r.heading : fallback.heading,
        items: sanitizeInterestItems(r.items, fallback.items),
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

function defaultDataForType(type: HomeSectionType): HomeSection["data"] {
    const template = defaultFrontPage.sections.find((s) => s.type === type);
    if (template) return structuredClone(template.data);
    return emptySectionData(type);
}

function sanitizeHomeSection(raw: unknown, fallback?: HomeSection): HomeSection | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    const type = r.type;
    if (!id || typeof type !== "string" || !HOME_SECTION_TYPES.includes(type as HomeSectionType)) {
        return null;
    }
    const label =
        typeof r.label === "string" && r.label.length > 0
            ? r.label
            : (fallback?.label ?? SECTION_TYPE_LABELS[type as HomeSectionType]);
    const removable = typeof r.removable === "boolean" ? r.removable : fallback?.removable;
    const dataFallback = fallback?.data ?? defaultDataForType(type as HomeSectionType);

    switch (type) {
        case "hero":
            return {
                id,
                type: "hero",
                label,
                removable,
                data: sanitizeHeroData(r.data, dataFallback as HeroSectionData),
            };
        case "textBlock":
            return {
                id,
                type: "textBlock",
                label,
                removable,
                data: sanitizeTextBlockData(r.data, dataFallback as TextBlockSectionData),
            };
        case "cards":
            return {
                id,
                type: "cards",
                label,
                removable,
                data: sanitizeCardsData(r.data, dataFallback as CardsSectionData),
            };
        case "interests":
            return {
                id,
                type: "interests",
                label,
                removable,
                data: sanitizeInterestsData(r.data, dataFallback as InterestsSectionData),
            };
        case "contact":
            return {
                id,
                type: "contact",
                label,
                removable,
                data: sanitizeContactData(r.data, dataFallback as ContactSectionData),
            };
        default:
            return null;
    }
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
