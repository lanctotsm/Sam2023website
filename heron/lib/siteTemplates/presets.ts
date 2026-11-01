import {
    defaultPageBackground,
    defaultPageStyle,
    type NavStyleConfig,
    type PageStyleConfig,
    type PageStyleEntry,
    type PageStyles,
} from "@/lib/frontPageDefaults";
import type { FrontPageSettings } from "@/lib/frontPage";
import { journalFrontPage } from "./journalHome";
import type { SiteTemplatePreset, SiteTemplateSnapshot } from "./types";

export const JOURNAL_TEMPLATE_ID = "journal";
export const FIELD_NOTES_TEMPLATE_ID = "field-notes";

const CHESTNUT = "#480903";
const CHESTNUT_DARK = "#2a0502";
const DESERT_TAN = "#e5d1a4";
const CARAMEL = "#ce793a";
const CANVAS = "#f7f0e4";
const INK = "#1c1917";
const PAPER = "#f5f0e6";
const FIELD_CARD = "#faf7f2";

function pageEntry(style: Partial<PageStyleConfig>): PageStyleEntry {
    return {
        background: { ...defaultPageBackground },
        style: { ...defaultPageStyle, ...style },
    };
}

function allPages(style: Partial<PageStyleConfig>): PageStyles {
    const entry = pageEntry(style);
    return {
        home: structuredClone(entry),
        albums: structuredClone(entry),
        posts: structuredClone(entry),
        resume: structuredClone(entry),
    };
}

function fieldNotesFrontPage(): FrontPageSettings {
    const sections: FrontPageSettings["sections"] = [
        {
            id: "fld-banner",
            templateId: "banner",
            label: "Top banner",
            data: {
                title: "Samuel Lanctot",
                subtitle: "A place for the pictures.",
                backgroundType: "gradient",
                backgroundColor: "",
                backgroundImage: "",
                gradientFrom: "",
                gradientTo: "",
                variant: "band",
            },
        },
        {
            id: "fld-recent",
            templateId: "recent-work",
            label: "Albums",
            data: {
                heading: "Albums",
                albumLimit: 6,
                postLimit: 3,
                showAlbums: true,
                showPosts: false,
            },
        },
        {
            id: "fld-note",
            templateId: "text-block",
            label: "Note",
            data: {
                heading: "Field notes",
                paragraphs: ["The albums come first. Writing sits behind them."],
            },
        },
        {
            id: "fld-contact",
            templateId: "contact",
            label: "Contact",
            data: {
                heading: "Let's Connect",
                text: "Say hello, or go straight to the pictures.",
                showSocials: true,
                links: [
                    { icon: "Mail", label: "Email", url: "mailto:lanctotsm@gmail.com" },
                    { icon: "Github", label: "GitHub", url: "https://github.com/samlanctot" },
                    { icon: "Linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/samuel-lanctot/" },
                    { icon: "FileText", label: "Resume", url: "/resume" },
                ],
            },
        },
    ];
    return { sections, sectionOrder: sections.map((section) => section.id) };
}

const journalNav: NavStyleConfig = {
    bgColor: CHESTNUT,
    bgColorDark: CHESTNUT_DARK,
    textColor: DESERT_TAN,
    textColorDark: DESERT_TAN,
    accentColor: CARAMEL,
    accentColorDark: CARAMEL,
    font: "Fraunces",
};

const fieldNotesNav: NavStyleConfig = {
    bgColor: INK,
    bgColorDark: "#0c0a09",
    textColor: PAPER,
    textColorDark: PAPER,
    accentColor: "#d6b48a",
    accentColorDark: "#d6b48a",
    font: "Crimson Text",
};

function journalSnapshot(): SiteTemplateSnapshot {
    return {
        front_page: journalFrontPage(),
        page_styles: allPages({
            headingFont: "Fraunces",
            bodyFont: "Inter",
            h1Color: CHESTNUT,
            h1ColorDark: "#ece2c8",
            h2Color: CHESTNUT,
            h2ColorDark: "#ece2c8",
            bodyColor: CHESTNUT_DARK,
            bodyColorDark: "#ece2c8",
            linkColor: "#b64b12",
            linkColorDark: DESERT_TAN,
            cardBg: CANVAS,
            cardBgDark: "#171513",
            cardBorder: DESERT_TAN,
            cardBorderDark: "#5c1008",
        }),
        nav_styles: { ...journalNav },
    };
}

function fieldNotesSnapshot(): SiteTemplateSnapshot {
    return {
        front_page: fieldNotesFrontPage(),
        page_styles: allPages({
            headingFont: "Crimson Text",
            bodyFont: "Crimson Text",
            h1Color: INK,
            h1ColorDark: PAPER,
            h2Color: INK,
            h2ColorDark: PAPER,
            bodyColor: "#292524",
            bodyColorDark: "#e7e5e4",
            linkColor: "#9a3412",
            linkColorDark: "#d6b48a",
            cardBg: FIELD_CARD,
            cardBgDark: INK,
            cardBorder: "#d6d3d1",
            cardBorderDark: "#44403c",
        }),
        nav_styles: { ...fieldNotesNav },
    };
}

export function getJournalPreset(): SiteTemplatePreset {
    return {
        id: JOURNAL_TEMPLATE_ID,
        name: "Journal",
        description: "Chestnut and desert tan, Fraunces and Inter. A canvas masthead, a short about, recent work, and contact.",
        swatch: [CHESTNUT, DESERT_TAN, CARAMEL, CANVAS],
        snapshot: journalSnapshot(),
    };
}

export function getFieldNotesPreset(): SiteTemplatePreset {
    return {
        id: FIELD_NOTES_TEMPLATE_ID,
        name: "Field notes",
        description: "Crimson Text on dark ink. Albums lead the homepage.",
        swatch: [INK, PAPER, "#9a3412", FIELD_CARD],
        snapshot: fieldNotesSnapshot(),
    };
}

export function getSiteTemplatePresets(): SiteTemplatePreset[] {
    return [getJournalPreset(), getFieldNotesPreset()];
}
