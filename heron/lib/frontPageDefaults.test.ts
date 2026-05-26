import { describe, it, expect } from "vitest";
import {
    parsePageStyles,
    parseFrontPageConfig,
    defaultPageBackground,
    defaultPageStyle,
    defaultPageStyles,
    defaultFrontPage,
    createDefaultFrontPageConfig,
    createTextBlockSection,
    findSection,
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

    it("returns defaults when raw is a valid JSON non-object", () => {
        const result = parsePageStyles(JSON.stringify([1, 2, 3]));
        expect(result).toEqual(defaultPageStyles);
    });

    it("parses a fully specified valid config", () => {
        const input = {
            home: {
                background: {
                    backgroundType: "image",
                    backgroundImage: "https://example.com/bg.jpg",
                    backgroundColor: "",
                    gradientFrom: "",
                    gradientTo: "",
                },
                style: { ...defaultPageStyle, headingFont: "Merriweather", bodyFont: "DM Sans", h1Color: "#ff0000", h1ColorDark: "#ffffff" },
            },
            albums: { background: defaultPageBackground, style: defaultPageStyle },
            posts: { background: defaultPageBackground, style: defaultPageStyle },
            resume: { background: defaultPageBackground, style: defaultPageStyle },
        };
        const result = parsePageStyles(JSON.stringify(input));
        expect(result.home.background.backgroundType).toBe("image");
        expect(result.home.background.backgroundImage).toBe("https://example.com/bg.jpg");
        expect(result.home.style.headingFont).toBe("Merriweather");
        expect(result.home.style.bodyFont).toBe("DM Sans");
        expect(result.home.style.h1Color).toBe("#ff0000");
        expect(result.home.style.h1ColorDark).toBe("#ffffff");
    });
});

describe("parseFrontPageConfig", () => {
    it("returns default sections when raw is null", () => {
        const result = parseFrontPageConfig(null);
        const defaults = createDefaultFrontPageConfig();
        expect(result.sections).toHaveLength(defaults.sections.length);
        expect(result.sectionOrder).toEqual(defaults.sectionOrder);
    });

    it("parses new-format sections array", () => {
        const config = createDefaultFrontPageConfig();
        const journey = config.sections.find((s) => s.label === "Journey");
        expect(journey).toBeDefined();
        const order = config.sectionOrder.filter((id) => id !== journey!.id);
        const result = parseFrontPageConfig(JSON.stringify({ sections: config.sections, sectionOrder: order }));
        expect(result.sectionOrder).not.toContain(journey!.id);
        expect(findSection(result, journey!.id)?.data).toEqual(journey!.data);
    });

    it("parses user text block sections", () => {
        const custom = createTextBlockSection("Side project");
        const config = createDefaultFrontPageConfig();
        const heroId = config.sectionOrder[0];
        const result = parseFrontPageConfig(
            JSON.stringify({
                sections: [...config.sections, custom],
                sectionOrder: [heroId, custom.id],
            })
        );
        expect(result.sectionOrder).toEqual([heroId, custom.id]);
        expect(findSection(result, custom.id)?.type).toBe("textBlock");
        if (findSection(result, custom.id)?.type === "textBlock") {
            expect(findSection(result, custom.id)!.data.heading).toBe("Side project");
        }
    });

    it("returns defaults when JSON uses the old flat shape", () => {
        const legacy = {
            hero: { title: "Legacy Title", subtitle: "Sub" },
            sectionOrder: ["hero"],
        };
        const result = parseFrontPageConfig(JSON.stringify(legacy));
        expect(result.sections.length).toBe(createDefaultFrontPageConfig().sections.length);
    });
});

describe("defaultFrontPage", () => {
    it("has pre-seeded section rows with stable ids", () => {
        expect(defaultFrontPage.sections.length).toBeGreaterThanOrEqual(6);
        expect(defaultFrontPage.sectionOrder.length).toBe(defaultFrontPage.sections.length);
        for (const id of defaultFrontPage.sectionOrder) {
            expect(findSection(defaultFrontPage, id)).toBeDefined();
        }
    });
});
