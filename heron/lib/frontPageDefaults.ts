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

export * from "./frontPage";

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
