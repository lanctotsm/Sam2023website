import {
    Cormorant_Garamond,
    Crimson_Text,
    DM_Sans,
    Fraunces,
    Inter,
    Lato,
    Merriweather,
    Montserrat,
    Nunito,
    Open_Sans,
    Outfit,
    Playfair_Display,
    Poppins,
    Raleway,
    Roboto,
    Source_Sans_3,
} from "next/font/google";
import { isAvailableFont, type AvailableFont } from "@/lib/fonts";

/**
 * Self-hosted copies of every font offered in Settings. Using next/font means
 * the files are downloaded at build time and served from our origin — no
 * runtime dependency on fonts.googleapis.com, and no quoted family names that
 * break React SSR inline styles.
 *
 * next/font requires `variable` (and other options) to be string literals, so
 * these must match FONT_CSS_VARS in lib/fonts.ts by convention.
 *
 * Inter / Fraunces are the site theme defaults (`--font-body` / `--font-display`).
 */

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-body",
});

const fraunces = Fraunces({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-display",
});

const roboto = Roboto({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-roboto",
    preload: false,
});

const openSans = Open_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-open-sans",
    preload: false,
});

const lato = Lato({
    weight: ["400", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-lato",
    preload: false,
});

const montserrat = Montserrat({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-montserrat",
    preload: false,
});

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-playfair-display",
    preload: false,
});

const merriweather = Merriweather({
    weight: ["400", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-merriweather",
    preload: false,
});

const raleway = Raleway({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-raleway",
    preload: false,
});

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-poppins",
    preload: false,
});

const sourceSans3 = Source_Sans_3({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-source-sans-3",
    preload: false,
});

const nunito = Nunito({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-nunito",
    preload: false,
});

const outfit = Outfit({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-outfit",
    preload: false,
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-dm-sans",
    preload: false,
});

const cormorantGaramond = Cormorant_Garamond({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-cormorant-garamond",
    preload: false,
});

const crimsonText = Crimson_Text({
    weight: ["400", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-crimson-text",
    preload: false,
});

const fontVariableClass: Record<AvailableFont, string> = {
    Inter: inter.variable,
    Fraunces: fraunces.variable,
    Roboto: roboto.variable,
    "Open Sans": openSans.variable,
    Lato: lato.variable,
    Montserrat: montserrat.variable,
    "Playfair Display": playfairDisplay.variable,
    Merriweather: merriweather.variable,
    Raleway: raleway.variable,
    Poppins: poppins.variable,
    "Source Sans 3": sourceSans3.variable,
    Nunito: nunito.variable,
    Outfit: outfit.variable,
    "DM Sans": dmSans.variable,
    "Cormorant Garamond": cormorantGaramond.variable,
    "Crimson Text": crimsonText.variable,
};

/** Space-separated class names that define every `--font-*` CSS variable on an element. */
export const siteFontsClassName = Object.values(fontVariableClass).join(" ");

/**
 * Variable classes for the public document. Inter and Fraunces are always
 * included; pass the families `fontsUsedBySite` returns for anything else.
 */
export function publicFontsClassName(fonts: readonly string[]): string {
    const classes = [inter.variable, fraunces.variable];
    const seen = new Set<string>(classes);
    for (const font of fonts) {
        if (!isAvailableFont(font)) continue;
        const variableClass = fontVariableClass[font];
        if (seen.has(variableClass)) continue;
        seen.add(variableClass);
        classes.push(variableClass);
    }
    return classes.join(" ");
}

/** Exhaustiveness check: every AVAILABLE_FONTS entry has a loader variable. */
const _allFontsHaveVars: Record<AvailableFont, true> = {
    Inter: true,
    Fraunces: true,
    Roboto: true,
    "Open Sans": true,
    Lato: true,
    Montserrat: true,
    "Playfair Display": true,
    Merriweather: true,
    Raleway: true,
    Poppins: true,
    "Source Sans 3": true,
    Nunito: true,
    Outfit: true,
    "DM Sans": true,
    "Cormorant Garamond": true,
    "Crimson Text": true,
};
void _allFontsHaveVars;
