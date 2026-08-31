/** Section templates for the Posts page (home templates + posts-list + rss-feed). */

import type { HomeSectionTemplateData } from "@/lib/homeSectionTemplates/types";

export type PostsListSectionData = {
    heading: string;
};

export type RssFeedSectionData = {
    title: string;
    feedUrl: string;
};

export type PostsOnlyTemplateId = "posts-list" | "rss-feed";

export type PostsPageTemplateId =
    | PostsOnlyTemplateId
    | "banner"
    | "text-block"
    | "card-grid"
    | "tag-list"
    | "contact";

export type PostsPageSectionData =
    | HomeSectionTemplateData
    | PostsListSectionData
    | RssFeedSectionData;

export type PostsPageSection = {
    id: string;
    templateId: PostsPageTemplateId;
    label: string;
    removable?: boolean;
    data: PostsPageSectionData;
};

export type PostsPageSettings = {
    showPosts: boolean;
    sections: PostsPageSection[];
    sectionOrder: string[];
};

export const DEFAULT_POSTS_LIST_SECTION_ID = "posts-list-default";

export const POSTS_PAGE_HOME_TEMPLATE_IDS = [
    "banner",
    "text-block",
    "card-grid",
    "tag-list",
    "contact",
] as const satisfies readonly PostsPageTemplateId[];

export const POSTS_PAGE_ONLY_TEMPLATE_IDS = ["posts-list", "rss-feed"] as const satisfies readonly PostsPageTemplateId[];
