import { describe, it, expect } from "vitest";
import {
    parsePageBackgrounds,
    parsePageStyles,
    defaultPageBackground,
    defaultPageBackgrounds,
    defaultPageStyle,
    defaultPageStyles,
} from "./frontPageDefaults";

describe("parsePageBackgrounds", () => {
    it("returns defaults when raw is null", () => {
        const result = parsePageBackgrounds(null);
        expect(result).toEqual(defaultPageBackgrounds);
    });

    it("returns defaults when raw is empty string", () => {
        const result = parsePageBackgrounds("");
        expect(result).toEqual(defaultPageBackgrounds);
    });

    it("returns defaults when raw is invalid JSON", () => {
        const result = parsePageBackgrounds("NOT JSON {{{");
        expect(result).toEqual(defaultPageBackgrounds);
    });

    it("returns defaults when raw is a valid JSON non-object", () => {
        const result = parsePageBackgrounds(JSON.stringify([1, 2, 3]));
        expect(result).toEqual(defaultPageBackgrounds);
    });

    it("parses a fully specified valid config", () => {
        const input = {
            home: { backgroundType: "image", backgroundImage: "https://example.com/bg.jpg", backgroundColor: "", gradientFrom: "", gradientTo: "" },
            albums: { backgroundType: "color", backgroundColor: "#ff0000", backgroundImage: "", gradientFrom: "", gradientTo: "" },
            posts: { backgroundType: "gradient", gradientFrom: "#aaa", gradientTo: "#bbb", backgroundColor: "", backgroundImage: "" },
            resume: { backgroundType: "none", backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" },
        };
        const result = parsePageBackgrounds(JSON.stringify(input));
        expect(result.home.backgroundType).toBe("image");
        expect(result.home.backgroundImage).toBe("https://example.com/bg.jpg");
        expect(result.albums.backgroundType).toBe("color");
        expect(result.albums.backgroundColor).toBe("#ff0000");
        expect(result.posts.backgroundType).toBe("gradient");
        expect(result.posts.gradientFrom).toBe("#aaa");
        expect(result.resume.backgroundType).toBe("none");
    });

    it("merges partial configs with defaults — missing pages fall back to default", () => {
        const input = {
            home: { backgroundType: "color", backgroundColor: "#123456", backgroundImage: "", gradientFrom: "", gradientTo: "" },
        };
        const result = parsePageBackgrounds(JSON.stringify(input));
        expect(result.home.backgroundType).toBe("color");
        expect(result.home.backgroundColor).toBe("#123456");
        expect(result.albums).toEqual(defaultPageBackground);
        expect(result.posts).toEqual(defaultPageBackground);
        expect(result.resume).toEqual(defaultPageBackground);
    });

    it("sanitizes invalid backgroundType to 'none'", () => {
        const input = {
            home: { backgroundType: "INVALID_TYPE", backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" },
            albums: { backgroundType: null, backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" },
            posts: defaultPageBackground,
            resume: defaultPageBackground,
        };
        const result = parsePageBackgrounds(JSON.stringify(input));
        expect(result.home.backgroundType).toBe("none");
        expect(result.albums.backgroundType).toBe("none");
    });

    it("sanitizes non-string field values to empty string", () => {
        const input = {
            home: { backgroundType: "image", backgroundImage: 12345, backgroundColor: null, gradientFrom: {}, gradientTo: [] },
            albums: defaultPageBackground,
            posts: defaultPageBackground,
            resume: defaultPageBackground,
        };
        const result = parsePageBackgrounds(JSON.stringify(input));
        expect(result.home.backgroundImage).toBe("");
        expect(result.home.backgroundColor).toBe("");
        expect(result.home.gradientFrom).toBe("");
        expect(result.home.gradientTo).toBe("");
    });

    it("handles an empty-object page entry by returning defaults for that page", () => {
        const input = {
            home: {},
            albums: defaultPageBackground,
            posts: defaultPageBackground,
            resume: defaultPageBackground,
        };
        const result = parsePageBackgrounds(JSON.stringify(input));
        expect(result.home).toEqual(defaultPageBackground);
    });

    it("accepts all valid backgroundType values", () => {
        const types = ["none", "gradient", "color", "image"] as const;
        for (const t of types) {
            const input = { home: { ...defaultPageBackground, backgroundType: t }, albums: defaultPageBackground, posts: defaultPageBackground, resume: defaultPageBackground };
            const result = parsePageBackgrounds(JSON.stringify(input));
            expect(result.home.backgroundType).toBe(t);
        }
    });
});

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
