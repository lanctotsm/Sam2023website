import { describe, expect, it } from "vitest";
import { AVAILABLE_FONTS, fontCssVar, fontFamilyValue } from "@/lib/fonts";
import { buildPageCssVars } from "@/lib/pageStyleVars";
import { defaultPageStyle } from "@/lib/frontPageDefaults";

describe("fontFamilyValue", () => {
    it("maps every curated font to a CSS custom property reference", () => {
        for (const font of AVAILABLE_FONTS) {
            const value = fontFamilyValue(font);
            expect(value, font).toBeTruthy();
            expect(value, font).toMatch(/^var\(--font-[a-z0-9-]+\), (sans-serif|serif)$/);
            // Must not embed quoted family names — those break React SSR style="" attributes
            expect(value, font).not.toContain('"');
            expect(value, font).not.toContain("'");
        }
    });

    it("reuses theme tokens for Inter and Fraunces", () => {
        expect(fontCssVar("Inter")).toBe("--font-body");
        expect(fontCssVar("Fraunces")).toBe("--font-display");
        expect(fontFamilyValue("Inter")).toBe("var(--font-body), sans-serif");
        expect(fontFamilyValue("Fraunces")).toBe("var(--font-display), serif");
    });

    it("rejects unknown fonts", () => {
        expect(fontFamilyValue("")).toBeNull();
        expect(fontFamilyValue("Comic Sans MS")).toBeNull();
    });
});

describe("buildPageCssVars fonts", () => {
    it("writes heading/body fonts as var() references without quoted names", () => {
        const vars = buildPageCssVars({
            ...defaultPageStyle,
            headingFont: "Playfair Display",
            bodyFont: "DM Sans",
        }) as Record<string, string>;

        expect(vars["--page-heading-font"]).toBe("var(--font-playfair-display), serif");
        expect(vars["--page-body-font"]).toBe("var(--font-dm-sans), sans-serif");
        expect(vars["--page-heading-font"]).not.toContain('"');
        expect(vars["--page-body-font"]).not.toContain('"');
    });

    it("omits font vars when empty or unknown", () => {
        const empty = buildPageCssVars({ ...defaultPageStyle }) as Record<string, string>;
        expect(empty["--page-heading-font"]).toBeUndefined();
        expect(empty["--page-body-font"]).toBeUndefined();

        const bad = buildPageCssVars({
            ...defaultPageStyle,
            headingFont: "Not A Real Font",
        }) as Record<string, string>;
        expect(bad["--page-heading-font"]).toBeUndefined();
    });
});
