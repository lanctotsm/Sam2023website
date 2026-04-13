export type HeroSettings = {
    title: string;
    subtitle: string;
    backgroundType: "gradient" | "color" | "image";
    backgroundColor: string;
    backgroundImage: string;
    gradientFrom: string;
    gradientTo: string;
};

export type PageBackgroundConfig = {
    backgroundType: "none" | "gradient" | "color" | "image";
    backgroundColor: string;
    backgroundImage: string;
    gradientFrom: string;
    gradientTo: string;
};

export type PageStyleConfig = {
    headingFont: string;
    bodyFont: string;
    h1Color: string;
    h1ColorDark: string;
    h2Color: string;
    h2ColorDark: string;
    bodyColor: string;
    bodyColorDark: string;
    linkColor: string;
    linkColorDark: string;
    cardBg: string;
    cardBgDark: string;
    cardBorder: string;
    cardBorderDark: string;
};

export type PageStyleEntry = {
    background: PageBackgroundConfig;
    style: PageStyleConfig;
};

export type PageStyles = {
    home: PageStyleEntry;
    albums: PageStyleEntry;
    posts: PageStyleEntry;
    resume: PageStyleEntry;
};

export const defaultPageBackground: PageBackgroundConfig = {
    backgroundType: "none",
    backgroundColor: "",
    backgroundImage: "",
    gradientFrom: "",
    gradientTo: "",
};

export const defaultPageStyle: PageStyleConfig = {
    headingFont: "",
    bodyFont: "",
    h1Color: "",
    h1ColorDark: "",
    h2Color: "",
    h2ColorDark: "",
    bodyColor: "",
    bodyColorDark: "",
    linkColor: "",
    linkColorDark: "",
    cardBg: "",
    cardBgDark: "",
    cardBorder: "",
    cardBorderDark: "",
};

export const defaultPageStyleEntry: PageStyleEntry = {
    background: { ...defaultPageBackground },
    style: { ...defaultPageStyle },
};

export const defaultPageStyles: PageStyles = {
    home: { background: { ...defaultPageBackground }, style: { ...defaultPageStyle } },
    albums: { background: { ...defaultPageBackground }, style: { ...defaultPageStyle } },
    posts: { background: { ...defaultPageBackground }, style: { ...defaultPageStyle } },
    resume: { background: { ...defaultPageBackground }, style: { ...defaultPageStyle } },
};

// Keep legacy types for backward compatibility
export type PageBackgrounds = {
    home: PageBackgroundConfig;
    albums: PageBackgroundConfig;
    posts: PageBackgroundConfig;
    resume: PageBackgroundConfig;
};

export const defaultPageBackgrounds: PageBackgrounds = {
    home: { ...defaultPageBackground },
    albums: { ...defaultPageBackground },
    posts: { ...defaultPageBackground },
    resume: { ...defaultPageBackground },
};


export type AboutSettings = {
    heading: string;
    paragraphs: string[];
};

export type CardItem = {
    icon: string;
    title: string;
    text: string;
};

export type CardsSettings = {
    heading: string;
    columns: number;
    items: CardItem[];
};

export type JourneySettings = {
    heading: string;
    paragraphs: string[];
};

export type InterestItem = {
    icon: string;
    label: string;
};

export type InterestsSettings = {
    heading: string;
    items: InterestItem[];
};

export type ContactLink = {
    icon: string;
    label: string;
    url: string;
};

export type ContactSettings = {
    heading: string;
    text: string;
    showSocials: boolean;
    links: ContactLink[];
};

export type FrontPageSettings = {
    hero: HeroSettings;
    about: AboutSettings;
    cards: CardsSettings;
    journey: JourneySettings;
    interests: InterestsSettings;
    contact: ContactSettings;
};

export const defaultFrontPage: FrontPageSettings = {
    hero: {
        title: "Samuel Lanctot",
        subtitle:
            "Developer, creator, and lifelong learner passionate about building meaningful experiences through technology and art.",
        backgroundType: "gradient",
        backgroundColor: "#6B2D2D",
        backgroundImage: "",
        gradientFrom: "",
        gradientTo: ""
    },
    about: {
        heading: "About Me",
        paragraphs: [
            "Hello! My name is Sam Lanctot, I'm a software engineer in the DC metro area. Currently I'm employed at GEICO as a Senior Software Engineer working on commercial software dealing with DuckCreek and Next.js based service applications.",
            "I have 7 years experience in full stack .NET development and 2 years experience in Node.js/Python/Scala development. My journey began with a fascination for how things work, which evolved into a passion for building solutions that matter.",
            "My hobbies include photography, Magic the Gathering, Dungeons & Dragons, and video games. I also enjoy traveling especially by train. I live in Silver Spring with my wife Caitlin and our two wonderful cats, Catniss and Byron."
        ]
    },
    cards: {
        heading: "What I Do",
        columns: 2,
        items: [
            {
                icon: "Monitor",
                title: "Software Development",
                text: "Building robust applications with modern technologies. From backend systems to responsive frontends, I enjoy crafting elegant solutions to complex problems."
            },
            {
                icon: "Camera",
                title: "Photography",
                text: "Capturing moments and telling stories through the lens. I'm drawn to landscapes, street photography, and the quiet beauty of everyday life."
            },
            {
                icon: "Palette",
                title: "Creative Projects",
                text: "Exploring the boundaries between art and technology. Whether it's generative art, interactive installations, or digital experiments, I love pushing creative limits."
            },
            {
                icon: "BookOpen",
                title: "Continuous Learning",
                text: "Always expanding my horizons through books, courses, and hands-on experimentation. The tech landscape is ever-evolving, and I aim to evolve with it."
            }
        ]
    },
    journey: {
        heading: "My Journey",
        paragraphs: [
            "My path has been anything but linear—and I wouldn't have it any other way. What started as tinkering with computers in my youth has grown into a fulfilling career building software that people actually use. Along the way, I've had the privilege of working with talented teams, tackling interesting challenges, and continuously refining my craft.",
            "I've learned that the most rewarding work happens at the intersection of passion and purpose. Whether I'm debugging a tricky issue at 2 AM or capturing the perfect golden hour shot, the common thread is the joy of creating something meaningful."
        ]
    },
    interests: {
        heading: "Beyond the Screen",
        items: [
            { icon: "Mountain", label: "Hiking & Nature" },
            { icon: "Coffee", label: "Coffee Culture" },
            { icon: "Music", label: "Music Discovery" },
            { icon: "BookOpen", label: "Science Fiction" },
            { icon: "Gamepad2", label: "Indie Games" },
            { icon: "Plane", label: "Travel" }
        ]
    },
    contact: {
        heading: "Let's Connect",
        text: "I'm always open to interesting conversations, collaboration opportunities, or just saying hello. Whether you have a project in mind, want to discuss photography, or simply want to chat about the latest in tech—feel free to reach out.",
        showSocials: true,
        links: [
            { icon: "Mail", label: "Email", url: "mailto:lanctotsm@gmail.com" },
            { icon: "Github", label: "GitHub", url: "https://github.com/samlanctot" },
            {
                icon: "Briefcase",
                label: "LinkedIn",
                url: "https://www.linkedin.com/in/samuel-lanctot/"
            },
            { icon: "FileText", label: "Resume", url: "/resume" }
        ]
    }
};

/**
 * Parse a raw JSON string (from the DB) into a FrontPageSettings object,
 * merging with defaults so missing keys always have a fallback.
 *
 * This function also performs light runtime validation/coercion on nested
 * array fields so that malformed JSON (e.g. wrong shapes or types for
 * paragraphs/items/links) falls back to defaults instead of causing
 * runtime errors in components that iterate over these arrays.
 */

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sanitizeStringArray(
    value: unknown,
    fallback: string[]
): string[] {
    if (isStringArray(value)) {
        return value;
    }
    return fallback;
}

function sanitizeCardItems(
    value: unknown,
    fallback: CardItem[]
): CardItem[] {
    if (!Array.isArray(value)) return fallback;
    const items: CardItem[] = [];
    for (const item of value) {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as any).icon === "string" &&
            typeof (item as any).title === "string" &&
            typeof (item as any).text === "string"
        ) {
            items.push({
                icon: (item as any).icon,
                title: (item as any).title,
                text: (item as any).text,
            });
        }
    }
    return items.length > 0 ? items : fallback;
}

function sanitizeInterestItems(
    value: unknown,
    fallback: InterestItem[]
): InterestItem[] {
    if (!Array.isArray(value)) return fallback;
    const items: InterestItem[] = [];
    for (const item of value) {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as any).icon === "string" &&
            typeof (item as any).label === "string"
        ) {
            items.push({
                icon: (item as any).icon,
                label: (item as any).label,
            });
        }
    }
    return items.length > 0 ? items : fallback;
}

function sanitizeContactLinks(
    value: unknown,
    fallback: ContactLink[]
): ContactLink[] {
    if (!Array.isArray(value)) return fallback;
    const links: ContactLink[] = [];
    for (const item of value) {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as any).icon === "string" &&
            typeof (item as any).label === "string" &&
            typeof (item as any).url === "string"
        ) {
            links.push({
                icon: (item as any).icon,
                label: (item as any).label,
                url: (item as any).url,
            });
        }
    }
    return links.length > 0 ? links : fallback;
}

export function parseFrontPageConfig(raw: string | null): FrontPageSettings {
    if (!raw) return defaultFrontPage;
    try {
        const parsed = JSON.parse(raw);

        const root = parsed && typeof parsed === "object" ? (parsed as any) : {};

        // Hero: flat object, shallow merge is sufficient.
        const hero: HeroSettings = {
            ...defaultFrontPage.hero,
            ...(root.hero && typeof root.hero === "object" ? root.hero : {}),
        };

        // About: ensure paragraphs is an array of strings.
        const rawAbout = root.about && typeof root.about === "object" ? root.about : {};
        const { paragraphs: aboutParagraphsRaw, ...aboutRest } = rawAbout as any;
        const about: AboutSettings = {
            ...defaultFrontPage.about,
            ...aboutRest,
            paragraphs: sanitizeStringArray(
                aboutParagraphsRaw,
                defaultFrontPage.about.paragraphs
            ),
        };

        // Cards: ensure items is an array of CardItem.
        const rawCards = root.cards && typeof root.cards === "object" ? root.cards : {};
        const { items: cardsItemsRaw, ...cardsRest } = rawCards as any;
        const cards: CardsSettings = {
            ...defaultFrontPage.cards,
            ...cardsRest,
            items: sanitizeCardItems(
                cardsItemsRaw,
                defaultFrontPage.cards.items
            ),
        };

        // Journey: ensure paragraphs is an array of strings.
        const rawJourney =
            root.journey && typeof root.journey === "object" ? root.journey : {};
        const { paragraphs: journeyParagraphsRaw, ...journeyRest } = rawJourney as any;
        const journey: JourneySettings = {
            ...defaultFrontPage.journey,
            ...journeyRest,
            paragraphs: sanitizeStringArray(
                journeyParagraphsRaw,
                defaultFrontPage.journey.paragraphs
            ),
        };

        // Interests: ensure items is an array of InterestItem.
        const rawInterests =
            root.interests && typeof root.interests === "object" ? root.interests : {};
        const { items: interestsItemsRaw, ...interestsRest } = rawInterests as any;
        const interests: InterestsSettings = {
            ...defaultFrontPage.interests,
            ...interestsRest,
            items: sanitizeInterestItems(
                interestsItemsRaw,
                defaultFrontPage.interests.items
            ),
        };

        // Contact: ensure links is an array of ContactLink.
        const rawContact =
            root.contact && typeof root.contact === "object" ? root.contact : {};
        const { links: contactLinksRaw, ...contactRest } = rawContact as any;
        const contact: ContactSettings = {
            ...defaultFrontPage.contact,
            ...contactRest,
            links: sanitizeContactLinks(
                contactLinksRaw,
                defaultFrontPage.contact.links
            ),
        };

        return {
            hero,
            about,
            cards,
            journey,
            interests,
            contact,
        };
    } catch {
        return defaultFrontPage;
    }
}

const VALID_BG_TYPES = new Set(["none", "gradient", "color", "image"]);

function sanitizePageBg(raw: unknown): PageBackgroundConfig {
    const d = defaultPageBackground;
    if (!raw || typeof raw !== "object") return { ...d };
    const r = raw as Record<string, unknown>;
    return {
        backgroundType: VALID_BG_TYPES.has(r.backgroundType as string)
            ? (r.backgroundType as PageBackgroundConfig["backgroundType"])
            : d.backgroundType,
        backgroundColor: typeof r.backgroundColor === "string" ? r.backgroundColor : d.backgroundColor,
        backgroundImage: typeof r.backgroundImage === "string" ? r.backgroundImage : d.backgroundImage,
        gradientFrom: typeof r.gradientFrom === "string" ? r.gradientFrom : d.gradientFrom,
        gradientTo: typeof r.gradientTo === "string" ? r.gradientTo : d.gradientTo,
    };
}

export function parsePageBackgrounds(raw: string | null): PageBackgrounds {
    if (!raw) return { ...defaultPageBackgrounds };
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return { ...defaultPageBackgrounds };
        const p = parsed as Record<string, unknown>;
        return {
            home: sanitizePageBg(p.home),
            albums: sanitizePageBg(p.albums),
            posts: sanitizePageBg(p.posts),
            resume: sanitizePageBg(p.resume),
        };
    } catch {
        return { ...defaultPageBackgrounds };
    }
}

function str(val: unknown, fallback: string): string {
    return typeof val === "string" ? val : fallback;
}

function sanitizePageStyle(raw: unknown): PageStyleConfig {
    const d = defaultPageStyle;
    if (!raw || typeof raw !== "object") return { ...d };
    const r = raw as Record<string, unknown>;
    return {
        headingFont: str(r.headingFont, d.headingFont),
        bodyFont: str(r.bodyFont, d.bodyFont),
        h1Color: str(r.h1Color, d.h1Color),
        h1ColorDark: str(r.h1ColorDark, d.h1ColorDark),
        h2Color: str(r.h2Color, d.h2Color),
        h2ColorDark: str(r.h2ColorDark, d.h2ColorDark),
        bodyColor: str(r.bodyColor, d.bodyColor),
        bodyColorDark: str(r.bodyColorDark, d.bodyColorDark),
        linkColor: str(r.linkColor, d.linkColor),
        linkColorDark: str(r.linkColorDark, d.linkColorDark),
        cardBg: str(r.cardBg, d.cardBg),
        cardBgDark: str(r.cardBgDark, d.cardBgDark),
        cardBorder: str(r.cardBorder, d.cardBorder),
        cardBorderDark: str(r.cardBorderDark, d.cardBorderDark),
    };
}

function sanitizePageStyleEntry(raw: unknown): PageStyleEntry {
    if (!raw || typeof raw !== "object") {
        return { background: { ...defaultPageBackground }, style: { ...defaultPageStyle } };
    }
    const r = raw as Record<string, unknown>;
    return {
        background: sanitizePageBg(r.background),
        style: sanitizePageStyle(r.style),
    };
}

export function parsePageStyles(raw: string | null): PageStyles {
    if (!raw) return { ...defaultPageStyles };
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return { ...defaultPageStyles };
        const p = parsed as Record<string, unknown>;
        return {
            home: sanitizePageStyleEntry(p.home),
            albums: sanitizePageStyleEntry(p.albums),
            posts: sanitizePageStyleEntry(p.posts),
            resume: sanitizePageStyleEntry(p.resume),
        };
    } catch {
        return { ...defaultPageStyles };
    }
}

// ─── Navigation Styles ──────────────────────────────────────────────────────

export type NavStyleConfig = {
    /** Background color of the nav bar. Empty = theme default (chestnut). */
    bgColor: string;
    /** Dark-mode background. Empty = theme default (dark-surface). */
    bgColorDark: string;
    /** Nav link text color. Empty = theme default (desert-tan). */
    textColor: string;
    /** Dark-mode link text color. */
    textColorDark: string;
    /** Active/hover link color. Empty = theme default (caramel-light). */
    accentColor: string;
    /** Dark-mode active/hover color. */
    accentColorDark: string;
    /** Font for nav links. Empty = inherit body font. */
    font: string;
};

export const defaultNavStyle: NavStyleConfig = {
    bgColor: "",
    bgColorDark: "",
    textColor: "",
    textColorDark: "",
    accentColor: "",
    accentColorDark: "",
    font: "",
};

export function parseNavStyles(raw: string | null): NavStyleConfig {
    if (!raw) return { ...defaultNavStyle };
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { ...defaultNavStyle };
        }
        const r = parsed as Record<string, unknown>;
        return {
            bgColor: str(r.bgColor, defaultNavStyle.bgColor),
            bgColorDark: str(r.bgColorDark, defaultNavStyle.bgColorDark),
            textColor: str(r.textColor, defaultNavStyle.textColor),
            textColorDark: str(r.textColorDark, defaultNavStyle.textColorDark),
            accentColor: str(r.accentColor, defaultNavStyle.accentColor),
            accentColorDark: str(r.accentColorDark, defaultNavStyle.accentColorDark),
            font: str(r.font, defaultNavStyle.font),
        };
    } catch {
        return { ...defaultNavStyle };
    }
}
