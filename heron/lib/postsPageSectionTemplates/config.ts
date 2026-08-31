import {
    HOME_SECTION_TEMPLATE_DEFS,
    resolveTemplateId,
    sanitizeTemplateData,
} from "@/lib/homeSectionTemplates/definitions";
import type { HomeSectionTemplateId } from "@/lib/homeSectionTemplates/types";
import { isAllowedFeedUrl } from "@/lib/feeds/fetchFeed";
import type {
    PostsListSectionData,
    PostsPageSection,
    PostsPageSectionData,
    PostsPageSettings,
    PostsPageTemplateId,
    RssFeedSectionData,
} from "./types";
import {
    DEFAULT_POSTS_LIST_SECTION_ID,
    POSTS_PAGE_HOME_TEMPLATE_IDS,
} from "./types";

const MAX_FEEDS = 20;

export { DEFAULT_POSTS_LIST_SECTION_ID };

export const POSTS_PAGE_TEMPLATE_DEFS = {
    "posts-list": {
        id: "posts-list" as const,
        label: "Posts list",
        description: "Grid of blog posts from the CMS.",
        defaultData: (): PostsListSectionData => ({ heading: "Posts" }),
        sanitize: (raw: unknown, fb: PostsListSectionData): PostsListSectionData => {
            if (!raw || typeof raw !== "object") return { ...fb };
            const r = raw as Record<string, unknown>;
            return {
                heading: typeof r.heading === "string" ? r.heading : fb.heading,
            };
        },
    },
    "rss-feed": {
        id: "rss-feed" as const,
        label: "RSS feed",
        description: "Live items from an RSS or Atom URL.",
        defaultData: (): RssFeedSectionData => ({ title: "", feedUrl: "" }),
        sanitize: (raw: unknown, fb: RssFeedSectionData): RssFeedSectionData => {
            if (!raw || typeof raw !== "object") return { ...fb };
            const r = raw as Record<string, unknown>;
            const title = typeof r.title === "string" ? r.title.trim() : fb.title;
            const feedUrl = typeof r.feedUrl === "string" ? r.feedUrl.trim() : fb.feedUrl;
            const allowHttp = process.env.NODE_ENV === "test";
            const safeUrl = feedUrl && isAllowedFeedUrl(feedUrl, allowHttp) ? feedUrl : "";
            return { title, feedUrl: safeUrl };
        },
    },
};

export function isHomeTemplateId(id: PostsPageTemplateId): id is HomeSectionTemplateId {
    return (POSTS_PAGE_HOME_TEMPLATE_IDS as readonly string[]).includes(id);
}

function resolvePostsPageTemplateId(raw: unknown): PostsPageTemplateId | null {
    if (typeof raw !== "string" || raw.length === 0) return null;
    if (raw === "posts-list" || raw === "rss-feed") return raw;
    return resolveTemplateId(raw);
}

function sanitizePostsPageSectionData(
    templateId: PostsPageTemplateId,
    raw: unknown,
    fallback: PostsPageSectionData
): PostsPageSectionData {
    if (templateId === "posts-list") {
        return POSTS_PAGE_TEMPLATE_DEFS["posts-list"].sanitize(raw, fallback as PostsListSectionData);
    }
    if (templateId === "rss-feed") {
        return POSTS_PAGE_TEMPLATE_DEFS["rss-feed"].sanitize(raw, fallback as RssFeedSectionData);
    }
    return sanitizeTemplateData(templateId, raw, fallback as Parameters<typeof sanitizeTemplateData>[2]);
}

function defaultDataForTemplate(templateId: PostsPageTemplateId): PostsPageSectionData {
    if (templateId === "posts-list") return POSTS_PAGE_TEMPLATE_DEFS["posts-list"].defaultData();
    if (templateId === "rss-feed") return POSTS_PAGE_TEMPLATE_DEFS["rss-feed"].defaultData();
    return HOME_SECTION_TEMPLATE_DEFS[templateId].defaultData();
}

export function getPostsPageTemplateLabel(templateId: PostsPageTemplateId): string {
    if (templateId === "posts-list" || templateId === "rss-feed") {
        return POSTS_PAGE_TEMPLATE_DEFS[templateId].label;
    }
    return HOME_SECTION_TEMPLATE_DEFS[templateId].label;
}

export function createDefaultPostsListSection(): PostsPageSection {
    return {
        id: DEFAULT_POSTS_LIST_SECTION_ID,
        templateId: "posts-list",
        label: "Posts",
        removable: false,
        data: { heading: "Posts" },
    };
}

export function createDefaultPostsPageConfig(): PostsPageSettings {
    const postsList = createDefaultPostsListSection();
    return {
        showPosts: true,
        sections: [postsList],
        sectionOrder: [postsList.id],
    };
}

export const defaultPostsPage = createDefaultPostsPageConfig();

export function newPostsPageSectionId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `ps${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPostsPageSection(
    templateId: PostsPageTemplateId,
    label?: string
): PostsPageSection {
    const isPostsList = templateId === "posts-list";
    const defLabel =
        templateId === "posts-list" || templateId === "rss-feed"
            ? POSTS_PAGE_TEMPLATE_DEFS[templateId].label
            : HOME_SECTION_TEMPLATE_DEFS[templateId].label;

    return {
        id: newPostsPageSectionId(),
        templateId,
        label: label ?? defLabel,
        removable: !isPostsList,
        data: defaultDataForTemplate(templateId),
    };
}

function sanitizeSection(raw: unknown, fallback?: PostsPageSection): PostsPageSection | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    const templateId = resolvePostsPageTemplateId(r.templateId ?? r.type);
    if (!id || !templateId) return null;

    const label =
        typeof r.label === "string" && r.label.length > 0
            ? r.label
            : (fallback?.label ?? getPostsPageTemplateLabel(templateId));

    const removable =
        templateId === "posts-list"
            ? false
            : typeof r.removable === "boolean"
              ? r.removable
              : (fallback?.removable ?? true);

    const dataFallback = fallback?.data ?? defaultDataForTemplate(templateId);

    return {
        id,
        templateId,
        label,
        removable,
        data: sanitizePostsPageSectionData(templateId, r.data, dataFallback),
    };
}

function ensurePostsListSection(sections: PostsPageSection[]): PostsPageSection[] {
    const hasPostsList = sections.some((s) => s.templateId === "posts-list");
    if (hasPostsList) return sections;
    return [createDefaultPostsListSection(), ...sections];
}

function sanitizeSections(value: unknown): PostsPageSection[] {
    if (!Array.isArray(value)) {
        return [createDefaultPostsListSection()];
    }

    const defaultsById = new Map(defaultPostsPage.sections.map((s) => [s.id, s]));
    const sections: PostsPageSection[] = [];

    for (const entry of value) {
        const fallback = defaultsById.get((entry as PostsPageSection)?.id ?? "");
        const section = sanitizeSection(entry, fallback);
        if (section && !sections.some((s) => s.id === section.id)) {
            sections.push(section);
        }
    }

    const withPostsList = ensurePostsListSection(
        sections.length > 0 ? sections : [createDefaultPostsListSection()]
    );

    const feedCount = withPostsList.filter((s) => s.templateId === "rss-feed").length;
    if (feedCount > MAX_FEEDS) {
        let seen = 0;
        return withPostsList.filter((s) => {
            if (s.templateId !== "rss-feed") return true;
            seen += 1;
            return seen <= MAX_FEEDS;
        });
    }

    return withPostsList;
}

function sanitizeSectionOrder(value: unknown, sectionIds: Set<string>): string[] {
    const defaultOrder = defaultPostsPage.sectionOrder;
    if (!Array.isArray(value)) return [...defaultOrder];
    const order: string[] = [];
    for (const entry of value) {
        if (typeof entry !== "string" || entry.length === 0) continue;
        const id = entry.startsWith("custom:") ? entry.slice("custom:".length) : entry;
        if (sectionIds.has(id) && !order.includes(id)) {
            order.push(id);
        }
    }

    for (const section of sectionIds) {
        if (!order.includes(section)) {
            order.push(section);
        }
    }

    return order.length > 0 ? order : [...defaultOrder];
}

export function parsePostsPageConfig(raw: string | null): PostsPageSettings {
    if (!raw) return createDefaultPostsPageConfig();
    try {
        const parsed = JSON.parse(raw);
        const root = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
        const showPosts = typeof root.showPosts === "boolean" ? root.showPosts : true;
        const sections = sanitizeSections(root.sections);
        const sectionIds = new Set(sections.map((s) => s.id));
        const sectionOrder = sanitizeSectionOrder(root.sectionOrder, sectionIds);
        return { showPosts, sections, sectionOrder };
    } catch {
        return createDefaultPostsPageConfig();
    }
}

export function findPostsPageSection(config: PostsPageSettings, id: string): PostsPageSection | undefined {
    return config.sections.find((s) => s.id === id);
}

export function getPostsPageSectionDisplayLabel(section: PostsPageSection): string {
    if (section.templateId === "rss-feed") {
        const title = (section.data as RssFeedSectionData).title?.trim();
        if (title) return title;
    }
    if (section.templateId === "posts-list") {
        const heading = (section.data as PostsListSectionData).heading?.trim();
        if (heading) return heading;
    }
    if (section.templateId === "text-block") {
        const heading = (section.data as { heading?: string }).heading?.trim();
        if (heading) return heading;
    }
    return section.label.trim() || getPostsPageTemplateLabel(section.templateId);
}
