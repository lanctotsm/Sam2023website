import type { FrontPageSettings, NavStyleConfig, PageStyles } from "@/lib/frontPageDefaults";

/** The three documents a template copies into settings. */
export type SiteTemplateSnapshot = {
    front_page: FrontPageSettings;
    page_styles: PageStyles;
    nav_styles: NavStyleConfig;
};

export type SiteTemplatePreset = {
    id: string;
    name: string;
    description: string;
    swatch: string[];
    snapshot: SiteTemplateSnapshot;
};

export type SavedSiteTemplate = {
    id: number;
    name: string;
    snapshot: SiteTemplateSnapshot;
    created_at: string;
};

export const SAVED_TEMPLATE_PREFIX = "saved:";

export function savedTemplateKey(id: number): string {
    return `${SAVED_TEMPLATE_PREFIX}${id}`;
}
