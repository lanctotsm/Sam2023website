import {
    defaultNavStyle,
    defaultPageStyles,
    parseFrontPageConfig,
    parseNavStyles,
    parsePageStyles,
    type FrontPageSettings,
    type NavStyleConfig,
    type PageStyles,
} from "@/lib/frontPageDefaults";
import { legacyBuiltInFrontPage } from "./legacyDefault";
import { SAVED_TEMPLATE_PREFIX, type SavedSiteTemplate, type SiteTemplatePreset, type SiteTemplateSnapshot } from "./types";

export type LiveTemplateStatus = {
    id: string | null;
    name: string;
    edited: boolean;
};

function sortValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortValue);
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(record).sort()) {
            sorted[key] = sortValue(record[key]);
        }
        return sorted;
    }
    return value;
}

/** Key order does not count as a difference. */
export function stableJson(value: unknown): string {
    return JSON.stringify(sortValue(value));
}

export function snapshotsEqual(a: unknown, b: unknown): boolean {
    return stableJson(a) === stableJson(b);
}

export function normalizeFrontPage(value: unknown): FrontPageSettings {
    if (typeof value === "string") return parseFrontPageConfig(value);
    if (value == null) return parseFrontPageConfig(null);
    return parseFrontPageConfig(JSON.stringify(value));
}

export function normalizePageStyles(value: unknown): PageStyles {
    if (typeof value === "string" || value == null) return parsePageStyles(typeof value === "string" ? value : null);
    return parsePageStyles(JSON.stringify(value));
}

export function normalizeNavStyles(value: unknown): NavStyleConfig {
    if (typeof value === "string" || value == null) return parseNavStyles(typeof value === "string" ? value : null);
    return parseNavStyles(JSON.stringify(value));
}

export function normalizeSnapshot(raw: unknown): SiteTemplateSnapshot | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const record = raw as Record<string, unknown>;
    if (!record.front_page || typeof record.front_page !== "object" || Array.isArray(record.front_page)) return null;
    if (!record.page_styles || typeof record.page_styles !== "object" || Array.isArray(record.page_styles)) return null;
    if (!record.nav_styles || typeof record.nav_styles !== "object" || Array.isArray(record.nav_styles)) return null;
    return {
        front_page: normalizeFrontPage(record.front_page),
        page_styles: normalizePageStyles(record.page_styles),
        nav_styles: normalizeNavStyles(record.nav_styles),
    };
}

function blank(value: string | null | undefined): boolean {
    return value == null || value.trim() === "";
}

/**
 * Journal may replace the live site only when the homepage is missing or still
 * the pre-template seed, and page/nav styles are missing or still empty.
 */
export function isUntouchedSite(
    frontRaw: string | null | undefined,
    pageRaw: string | null | undefined,
    navRaw: string | null | undefined
): boolean {
    const frontMatches =
        blank(frontRaw) || snapshotsEqual(normalizeFrontPage(frontRaw), normalizeFrontPage(legacyBuiltInFrontPage));
    const pageMatches = blank(pageRaw) || snapshotsEqual(normalizePageStyles(pageRaw), normalizePageStyles(defaultPageStyles));
    const navMatches = blank(navRaw) || snapshotsEqual(normalizeNavStyles(navRaw), normalizeNavStyles(defaultNavStyle));
    return frontMatches && pageMatches && navMatches;
}

function sameSnapshot(live: SiteTemplateSnapshot, candidate: SiteTemplateSnapshot): boolean {
    const left = normalizeSnapshot(live);
    const right = normalizeSnapshot(candidate);
    if (!left || !right) return false;
    return snapshotsEqual(left, right);
}

export function describeLiveTemplate(
    activeId: string,
    live: SiteTemplateSnapshot,
    presets: SiteTemplatePreset[],
    saved: SavedSiteTemplate[]
): LiveTemplateStatus {
    const trimmed = activeId.trim();
    if (trimmed) {
        const preset = presets.find((item) => item.id === trimmed);
        if (preset) {
            return { id: preset.id, name: preset.name, edited: !sameSnapshot(live, preset.snapshot) };
        }
        if (trimmed.startsWith(SAVED_TEMPLATE_PREFIX)) {
            const row = saved.find((item) => `${SAVED_TEMPLATE_PREFIX}${item.id}` === trimmed);
            if (row) {
                return { id: trimmed, name: row.name, edited: !sameSnapshot(live, row.snapshot) };
            }
            return { id: trimmed, name: "Removed template", edited: true };
        }
        return { id: trimmed, name: trimmed, edited: true };
    }

    const presetHit = presets.find((item) => sameSnapshot(live, item.snapshot));
    if (presetHit) return { id: presetHit.id, name: presetHit.name, edited: false };
    const savedHit = saved.find((item) => sameSnapshot(live, item.snapshot));
    if (savedHit) return { id: `${SAVED_TEMPLATE_PREFIX}${savedHit.id}`, name: savedHit.name, edited: false };
    return { id: null, name: "Custom setup", edited: false };
}
