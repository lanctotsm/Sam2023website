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
import type { AvailableFont } from "@/lib/fonts";

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
});

const openSans = Open_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-open-sans",
});

const lato = Lato({
    weight: ["400", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-lato",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-montserrat",
});

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-playfair-display",
});

const merriweather = Merriweather({
    weight: ["400", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-merriweather",
});

const raleway = Raleway({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-raleway",
});

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-poppins",
});

const sourceSans3 = Source_Sans_3({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-source-sans-3",
});

const nunito = Nunito({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-nunito",
});

const outfit = Outfit({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-outfit",
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-dm-sans",
});

const cormorantGaramond = Cormorant_Garamond({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-cormorant-garamond",
});

const crimsonText = Crimson_Text({
    weight: ["400", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-crimson-text",
});

/** Space-separated class names that define every `--font-*` CSS variable on an element. */
export const siteFontsClassName = [
    inter.variable,
    fraunces.variable,
    roboto.variable,
    openSans.variable,
    lato.variable,
    montserrat.variable,
    playfairDisplay.variable,
    merriweather.variable,
    raleway.variable,
    poppins.variable,
    sourceSans3.variable,
    nunito.variable,
    outfit.variable,
    dmSans.variable,
    cormorantGaramond.variable,
    crimsonText.variable,
].join(" ");

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
