import type { NavStyleConfig, PageStyles } from "@/lib/frontPageDefaults";
import { isAvailableFont, type AvailableFont } from "@/lib/fonts";

const PAGE_KEYS = ["home", "albums", "posts", "resume"] as const;

/**
 * Fonts the public document needs to define. Inter and Fraunces are the theme
 * defaults. Anything else is included only when a saved page or nav style names it.
 */
export function fontsUsedBySite(pageStyles: PageStyles, navStyle: NavStyleConfig): AvailableFont[] {
    const used: AvailableFont[] = ["Inter", "Fraunces"];
    const seen = new Set<AvailableFont>(used);

    const candidates: string[] = [];
    for (const key of PAGE_KEYS) {
        candidates.push(pageStyles[key].style.headingFont, pageStyles[key].style.bodyFont);
    }
    candidates.push(navStyle.font);

    for (const name of candidates) {
        if (!isAvailableFont(name) || seen.has(name)) continue;
        seen.add(name);
        used.push(name);
    }

    return used;
}
