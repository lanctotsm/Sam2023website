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
        expect(result.home.style.headingFont).toBe("Merriweather");
    });
});

describe("parseFrontPageConfig", () => {
    it("returns default sections when raw is null", () => {
        const result = parseFrontPageConfig(null);
        const defaults = createDefaultFrontPageConfig();
        expect(result.sections).toHaveLength(defaults.sections.length);
        expect(result.sectionOrder).toEqual(defaults.sectionOrder);
    });

    it("parses sections with templateId", () => {
        const config = createDefaultFrontPageConfig();
        const journey = config.sections.find((s) => s.label === "Journey");
        expect(journey?.templateId).toBe("text-block");
        const order = config.sectionOrder.filter((id) => id !== journey!.id);
        const result = parseFrontPageConfig(JSON.stringify({ sections: config.sections, sectionOrder: order }));
        expect(result.sectionOrder).not.toContain(journey!.id);
    });

    it("parses user text block sections", () => {
        const custom = createTextBlockSection("Side project");
        const config = createDefaultFrontPageConfig();
        const firstId = config.sectionOrder[0];
        const result = parseFrontPageConfig(
            JSON.stringify({
                sections: [...config.sections, custom],
                sectionOrder: [firstId, custom.id],
            })
        );
        expect(findSection(result, custom.id)?.templateId).toBe("text-block");
    });

    it("maps legacy type hero to banner template", () => {
        const result = parseFrontPageConfig(
            JSON.stringify({
                sections: [
                    {
                        id: "legacy-1",
                        type: "hero",
                        label: "Intro",
                        data: {
                            title: "Legacy Title",
                            subtitle: "Sub",
                            backgroundType: "gradient",
                            backgroundColor: "",
                            backgroundImage: "",
                            gradientFrom: "",
                            gradientTo: "",
                        },
                    },
                ],
                sectionOrder: ["legacy-1"],
            })
        );
        const section = findSection(result, "legacy-1");
        expect(section?.templateId).toBe("banner");
        if (section?.templateId === "banner") {
            expect(section.data.title).toBe("Legacy Title");
        }
    });

    it("returns defaults when JSON uses the old flat shape", () => {
        const legacy = { hero: { title: "Legacy Title" }, sectionOrder: ["hero"] };
        const result = parseFrontPageConfig(JSON.stringify(legacy));
        expect(result.sections.length).toBe(createDefaultFrontPageConfig().sections.length);
    });
});

describe("defaultFrontPage", () => {
    it("uses banner template for the top section, not a hero id", () => {
        const top = defaultFrontPage.sections[0];
        expect(top.templateId).toBe("banner");
        expect(top.label).toBe("Top banner");
    });

    it("does not ship an email address in the default contact section", () => {
        const json = JSON.stringify(defaultFrontPage);
        expect(json).not.toContain("mailto:");
        expect(json).not.toContain("@");
    });
});

describe("parseFrontPageConfig contact privacy", () => {
    it("strips mailto links and addresses from a saved contact section", () => {
        const raw = JSON.stringify({
            sections: [
                {
                    id: "c",
                    templateId: "contact",
                    label: "Contact",
                    data: {
                        heading: "Write owner@example.com",
                        text: "reach me at owner@example.com please",
                        showSocials: true,
                        links: [
                            { icon: "Mail", label: "Email", url: "mailto:owner@example.com" },
                            { icon: "Github", label: "GitHub", url: "https://github.com/example" }
                        ]
                    }
                }
            ],
            sectionOrder: ["c"]
        });
        const json = JSON.stringify(parseFrontPageConfig(raw));
        expect(json).not.toContain("owner@example.com");
        expect(json).not.toContain("mailto:");
        expect(json).toContain("GitHub");
        expect(json).toContain("Write");
    });
});
