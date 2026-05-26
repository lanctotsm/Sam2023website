import { describe, it, expect } from "vitest";
import {
    parsePageStyles,
    parseFrontPageConfig,
    defaultPageBackground,
    defaultPageStyle,
    defaultPageStyles,
    defaultFrontPage,
    DEFAULT_SECTION_ORDER,
    customSectionKey,
} from "./frontPageDefaults";

describe("parsePageStyles", () => {
    it("returns defaults when raw is null", () => {
        const result = parsePageStyles(null);
        expect(result).toEqual(defaultPageStyles);
    });

    it("returns defaults when raw is empty string", () => {
        const result = parsePageStyles("");
        expect(result).toEqual(defaultPageStyles);
    });

    it("returns defaults when raw is invalid JSON", () => {
        const result = parsePageStyles("NOT JSON {{{");
        expect(result).toEqual(defaultPageStyles);
    });

    it("returns defaults for non-object JSON", () => {
        const result = parsePageStyles(JSON.stringify("hello"));
        expect(result).toEqual(defaultPageStyles);
    });

    it("parses a fully specified valid config with background and style", () => {
        const input = {
            home: {
                background: { backgroundType: "image", backgroundImage: "https://example.com/bg.jpg", backgroundColor: "", gradientFrom: "", gradientTo: "" },
                style: { headingFont: "Playfair Display", bodyFont: "Inter", h1Color: "#111", h1ColorDark: "#eee", h2Color: "#222", h2ColorDark: "#ddd", bodyColor: "#333", bodyColorDark: "#ccc", linkColor: "#b64b12", linkColorDark: "#e8a060", cardBg: "#f5ead5", cardBgDark: "#252525", cardBorder: "#d4be8a", cardBorderDark: "#b8a86c" },
            },
            albums: { background: defaultPageBackground, style: defaultPageStyle },
            posts: { background: defaultPageBackground, style: defaultPageStyle },
            resume: { background: defaultPageBackground, style: defaultPageStyle },
        };
        const result = parsePageStyles(JSON.stringify(input));
        expect(result.home.background.backgroundType).toBe("image");
        expect(result.home.background.backgroundImage).toBe("https://example.com/bg.jpg");
        expect(result.home.style.headingFont).toBe("Playfair Display");
        expect(result.home.style.h1Color).toBe("#111");
        expect(result.home.style.cardBg).toBe("#f5ead5");
        expect(result.albums.style).toEqual(defaultPageStyle);
    });

    it("merges partial configs — missing pages fall back to defaults", () => {
        const input = {
            home: {
                background: { backgroundType: "color", backgroundColor: "#abc", backgroundImage: "", gradientFrom: "", gradientTo: "" },
                style: { headingFont: "Lato", bodyFont: "", h1Color: "", h1ColorDark: "", h2Color: "", h2ColorDark: "", bodyColor: "", bodyColorDark: "", linkColor: "", linkColorDark: "", cardBg: "", cardBgDark: "", cardBorder: "", cardBorderDark: "" },
            },
        };
        const result = parsePageStyles(JSON.stringify(input));
        expect(result.home.background.backgroundType).toBe("color");
        expect(result.home.style.headingFont).toBe("Lato");
        expect(result.albums.background).toEqual(defaultPageBackground);
        expect(result.albums.style).toEqual(defaultPageStyle);
    });

    it("sanitizes non-string style fields to empty string", () => {
        const input = {
            home: {
                background: defaultPageBackground,
                style: { headingFont: 123, bodyFont: null, h1Color: {}, h1ColorDark: [], h2Color: true, h2ColorDark: "", bodyColor: "", bodyColorDark: "", linkColor: "", linkColorDark: "", cardBg: "", cardBgDark: "", cardBorder: "", cardBorderDark: "" },
            },
            albums: { background: defaultPageBackground, style: defaultPageStyle },
            posts: { background: defaultPageBackground, style: defaultPageStyle },
            resume: { background: defaultPageBackground, style: defaultPageStyle },
        };
        const result = parsePageStyles(JSON.stringify(input));
        expect(result.home.style.headingFont).toBe("");
        expect(result.home.style.bodyFont).toBe("");
        expect(result.home.style.h1Color).toBe("");
        expect(result.home.style.h1ColorDark).toBe("");
        expect(result.home.style.h2Color).toBe("");
    });

    it("handles missing background or style subobjects gracefully", () => {
        const input = {
            home: {},                          // no background or style
            albums: { background: {} },        // no style
            posts: { style: {} },              // no background
            resume: { background: defaultPageBackground, style: defaultPageStyle },
        };
        const result = parsePageStyles(JSON.stringify(input));
        // home: both should be defaults
        expect(result.home.background).toEqual(defaultPageBackground);
        expect(result.home.style).toEqual(defaultPageStyle);
        // albums: style should be defaults
        expect(result.albums.style).toEqual(defaultPageStyle);
        // posts: background should be defaults
        expect(result.posts.background).toEqual(defaultPageBackground);
    });

    it("preserves valid style data alongside background data", () => {
        const input = {
            home: {
                background: { backgroundType: "gradient", gradientFrom: "#ff0000", gradientTo: "#0000ff", backgroundColor: "", backgroundImage: "" },
                style: { headingFont: "Merriweather", bodyFont: "DM Sans", h1Color: "#ff0000", h1ColorDark: "#ffffff", h2Color: "", h2ColorDark: "", bodyColor: "", bodyColorDark: "", linkColor: "", linkColorDark: "", cardBg: "", cardBgDark: "", cardBorder: "", cardBorderDark: "" },
            },
            albums: { background: defaultPageBackground, style: defaultPageStyle },
            posts: { background: defaultPageBackground, style: defaultPageStyle },
            resume: { background: defaultPageBackground, style: defaultPageStyle },
        };
        const result = parsePageStyles(JSON.stringify(input));
        expect(result.home.background.backgroundType).toBe("gradient");
        expect(result.home.background.gradientFrom).toBe("#ff0000");
        expect(result.home.style.headingFont).toBe("Merriweather");
        expect(result.home.style.bodyFont).toBe("DM Sans");
        expect(result.home.style.h1Color).toBe("#ff0000");
        expect(result.home.style.h1ColorDark).toBe("#ffffff");
    });
});

describe("parseFrontPageConfig sectionOrder", () => {
    it("returns default section order when legacy JSON has no sectionOrder", () => {
        const legacy = { ...defaultFrontPage };
        delete (legacy as { sectionOrder?: string[] }).sectionOrder;
        delete (legacy as { customSections?: unknown[] }).customSections;
        const result = parseFrontPageConfig(JSON.stringify(legacy));
        expect(result.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
        expect(result.customSections).toEqual([]);
    });

    it("omits journey when not in sectionOrder", () => {
        const order = DEFAULT_SECTION_ORDER.filter((id) => id !== "journey");
        const result = parseFrontPageConfig(
            JSON.stringify({ ...defaultFrontPage, sectionOrder: order })
        );
        expect(result.sectionOrder).not.toContain("journey");
        expect(result.journey.heading).toBe(defaultFrontPage.journey.heading);
    });

    it("parses custom sections referenced in sectionOrder", () => {
        const custom = { id: "abc123", heading: "Side project", paragraphs: ["Line one"] };
        const result = parseFrontPageConfig(
            JSON.stringify({
                ...defaultFrontPage,
                sectionOrder: ["hero", customSectionKey("abc123"), "contact"],
                customSections: [custom],
            })
        );
        expect(result.sectionOrder).toEqual(["hero", "custom:abc123", "contact"]);
        expect(result.customSections).toHaveLength(1);
        expect(result.customSections[0].heading).toBe("Side project");
    });
});
