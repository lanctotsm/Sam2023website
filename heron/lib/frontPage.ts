/** Homepage sections stored as rows in `front_page` settings JSON. */

import {
    HOME_SECTION_TEMPLATE_DEFS,
    HOME_SECTION_TEMPLATE_IDS,
    getTemplateLabel,
    resolveTemplateId,
    sanitizeTemplateData,
    type HomeSectionTemplateData,
    type HomeSectionTemplateId,
} from "./homeSectionTemplates";
import { journalFrontPage } from "./siteTemplates/journalHome";

export type { HomeSectionTemplateId, HomeSectionTemplateData } from "./homeSectionTemplates";
export type {
    BannerSectionData,
    TextBlockSectionData,
    CardGridSectionData,
    TagListSectionData,
    ContactSectionData,
    RecentWorkSectionData,
    BannerVariant,
    CardItem,
    TagItem,
    ContactLink,
} from "./homeSectionTemplates/types";

export { HOME_SECTION_TEMPLATE_IDS, HOME_SECTION_TEMPLATE_DEFS, getTemplateLabel } from "./homeSectionTemplates";

/** A single home page section row (template + data), stored in the DB. */
export type HomeSection = {
    id: string;
    templateId: HomeSectionTemplateId;
    label: string;
    removable?: boolean;
    data: HomeSectionTemplateData;
};

export type FrontPageSettings = {
    sections: HomeSection[];
    sectionOrder: string[];
};

export function newSectionId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `s${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSectionDisplayLabel(section: HomeSection): string {
    if (section.templateId === "text-block" || section.templateId === "recent-work") {
        const heading = (section.data as { heading?: string }).heading?.trim();
        if (heading) return heading;
    }
    return section.label.trim() || getTemplateLabel(section.templateId);
}

export function findSection(config: FrontPageSettings, id: string): HomeSection | undefined {
    return config.sections.find((s) => s.id === id);
}

export function createDefaultFrontPageConfig(): FrontPageSettings {
    return journalFrontPage();
}

export const defaultFrontPage = createDefaultFrontPageConfig();

export function createHomeSection(templateId: HomeSectionTemplateId, label?: string): HomeSection {
    const def = HOME_SECTION_TEMPLATE_DEFS[templateId];
    return {
        id: newSectionId(),
        templateId,
        label: label ?? def.label,
        removable: true,
        data: def.defaultData(),
    };
}

export function createTextBlockSection(heading = "New Section"): HomeSection {
    return {
        ...createHomeSection("text-block", heading),
        data: { heading, paragraphs: [""] },
    };
}

function defaultDataForTemplate(templateId: HomeSectionTemplateId): HomeSectionTemplateData {
    const template = defaultFrontPage.sections.find((s) => s.templateId === templateId);
    if (template) return structuredClone(template.data);
    return HOME_SECTION_TEMPLATE_DEFS[templateId].defaultData();
}

function sanitizeHomeSection(raw: unknown, fallback?: HomeSection): HomeSection | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    const templateId = resolveTemplateId(r.templateId ?? r.type);
    if (!id || !templateId) return null;

    const label =
        typeof r.label === "string" && r.label.length > 0
            ? r.label
            : (fallback?.label ?? getTemplateLabel(templateId));
    const removable = typeof r.removable === "boolean" ? r.removable : fallback?.removable;
    const dataFallback = fallback?.data ?? defaultDataForTemplate(templateId);

    return {
        id,
        templateId,
        label,
        removable,
        data: sanitizeTemplateData(templateId, r.data, dataFallback),
    };
}

function sanitizeSections(value: unknown): HomeSection[] {
    if (!Array.isArray(value)) return defaultFrontPage.sections.map((s) => structuredClone(s));
    const defaultsById = new Map(defaultFrontPage.sections.map((s) => [s.id, s]));
    const sections: HomeSection[] = [];
    for (const entry of value) {
        const fallback = defaultsById.get((entry as HomeSection)?.id ?? "");
        const section = sanitizeHomeSection(entry, fallback);
        if (section && !sections.some((s) => s.id === section.id)) {
            sections.push(section);
        }
    }
    return sections.length > 0 ? sections : defaultFrontPage.sections.map((s) => structuredClone(s));
}

function sanitizeSectionOrder(value: unknown, sectionIds: Set<string>): string[] {
    const defaultOrder = defaultFrontPage.sectionOrder;
    if (!Array.isArray(value)) return [...defaultOrder];
    const order: string[] = [];
    for (const entry of value) {
        if (typeof entry !== "string" || entry.length === 0) continue;
        const id = entry.startsWith("custom:") ? entry.slice("custom:".length) : entry;
        if (sectionIds.has(id) && !order.includes(id)) {
            order.push(id);
        }
    }
    return order.length > 0 ? order : [...defaultOrder];
}

export function parseFrontPageConfig(raw: string | null): FrontPageSettings {
    if (!raw) return createDefaultFrontPageConfig();
    try {
        const parsed = JSON.parse(raw);
        const root = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
        if (!Array.isArray(root.sections)) {
            return createDefaultFrontPageConfig();
        }
        const sections = sanitizeSections(root.sections);
        const sectionIds = new Set(sections.map((s) => s.id));
        const sectionOrder = sanitizeSectionOrder(root.sectionOrder, sectionIds);
        return { sections, sectionOrder };
    } catch {
        return createDefaultFrontPageConfig();
    }
}

export function getDefaultFrontPageJson(): string {
    return JSON.stringify(createDefaultFrontPageConfig());
}
