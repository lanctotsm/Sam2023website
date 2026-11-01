import { describe, expect, it } from "vitest";
import { defaultNavStyle, defaultPageStyles } from "@/lib/frontPageDefaults";
import { fontsUsedBySite } from "@/lib/publicFonts";

describe("fontsUsedBySite", () => {
    it("keeps the theme defaults when no custom fonts are saved", () => {
        expect(fontsUsedBySite(defaultPageStyles, defaultNavStyle)).toEqual(["Inter", "Fraunces"]);
    });

    it("adds fonts named by page styles and the nav, once each", () => {
        const pageStyles = {
            ...defaultPageStyles,
            home: {
                ...defaultPageStyles.home,
                style: {
                    ...defaultPageStyles.home.style,
                    headingFont: "Playfair Display",
                    bodyFont: "DM Sans",
                },
            },
            posts: {
                ...defaultPageStyles.posts,
                style: {
                    ...defaultPageStyles.posts.style,
                    headingFont: "Playfair Display",
                    bodyFont: "Not A Real Font",
                },
            },
        };

        expect(
            fontsUsedBySite(pageStyles, { ...defaultNavStyle, font: "Crimson Text" })
        ).toEqual(["Inter", "Fraunces", "Playfair Display", "DM Sans", "Crimson Text"]);
    });
});
