/** Curated list of Google Fonts available for page style customization. */
export const AVAILABLE_FONTS = [
    "Inter",
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
 * Build a Google Fonts stylesheet URL for the given font names.
 * Returns null if no valid fonts are provided.
 */
export function buildGoogleFontsUrl(fonts: string[]): string | null {
    const valid = fonts.filter(
        (f) => f && AVAILABLE_FONTS.includes(f as AvailableFont)
    );
    if (valid.length === 0) return null;

    const families = valid
        .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
        .join("&");
    return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
