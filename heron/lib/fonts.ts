/** Curated list of Google Fonts available for page style customization. */
export const AVAILABLE_FONTS = [
    "Inter",
    "Fraunces",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Playfair Display",
    "Merriweather",
    "Raleway",
    "Poppins",
    "Source Sans 3",
    "Nunito",
    "Outfit",
    "DM Sans",
    "Cormorant Garamond",
    "Crimson Text",
] as const;

export type AvailableFont = (typeof AVAILABLE_FONTS)[number];

/**
 * CSS custom property each curated font is registered under (via next/font in
 * `lib/siteFonts.ts`). Inter/Fraunces reuse the theme tokens already applied
 * on <body> by the root layout.
 *
 * Values are var() references — never quoted family names — so they are safe
 * to put in React SSR `style="..."` attributes (embedded `"` would terminate
 * the attribute and leave headings stuck on the Fraunces fallback).
 */
export const FONT_CSS_VARS: Record<AvailableFont, `--${string}`> = {
    Inter: "--font-body",
    Fraunces: "--font-display",
    Roboto: "--font-roboto",
    "Open Sans": "--font-open-sans",
    Lato: "--font-lato",
    Montserrat: "--font-montserrat",
    "Playfair Display": "--font-playfair-display",
    Merriweather: "--font-merriweather",
    Raleway: "--font-raleway",
    Poppins: "--font-poppins",
    "Source Sans 3": "--font-source-sans-3",
    Nunito: "--font-nunito",
    Outfit: "--font-outfit",
    "DM Sans": "--font-dm-sans",
    "Cormorant Garamond": "--font-cormorant-garamond",
    "Crimson Text": "--font-crimson-text",
};

const SERIF_FONTS = new Set<AvailableFont>([
    "Fraunces",
    "Playfair Display",
    "Merriweather",
    "Cormorant Garamond",
    "Crimson Text",
]);

export function isAvailableFont(font: string): font is AvailableFont {
    return (AVAILABLE_FONTS as readonly string[]).includes(font);
}

export function fontCssVar(font: string): string | null {
    if (!isAvailableFont(font)) return null;
    return FONT_CSS_VARS[font];
}

/**
 * CSS `font-family` value for a curated font, using the self-hosted next/font
 * CSS variable. Returns null for empty/unknown names.
 */
export function fontFamilyValue(font: string): string | null {
    const cssVar = fontCssVar(font);
    if (!cssVar || !isAvailableFont(font)) return null;
    const generic = SERIF_FONTS.has(font) ? "serif" : "sans-serif";
    return `var(${cssVar}), ${generic}`;
}

/**
 * @deprecated Prefer self-hosted next/font via `fontFamilyValue` / `lib/siteFonts.ts`.
 * Kept for any remaining Google Fonts link fallbacks.
 */
export function buildGoogleFontsUrl(fonts: string[]): string | null {
    const valid = fonts.filter((f) => f && isAvailableFont(f));
    if (valid.length === 0) return null;

    const families = valid
        .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
        .join("&");
    return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
