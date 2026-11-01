"use client";

import type { ComponentType } from "react";
import type { HomeSectionTemplateId } from "@/lib/homeSectionTemplates/types";
import type {
    PostsPageSectionData,
    PostsPageTemplateId,
} from "@/lib/postsPage";
import { POSTS_PAGE_TEMPLATE_DEFS } from "@/lib/postsPage";
import { HOME_SECTION_REGISTRY } from "@/components/home/sectionRegistry";
import { HOME_SECTION_TEMPLATE_DEFS } from "@/lib/homeSectionTemplates/definitions";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import { PostsListSectionEditor } from "@/components/posts/templates/PostsListSection";
import { RssFeedSectionEditor } from "@/components/posts/templates/RssFeedSection";

type SectionEditorComponent = ComponentType<SectionEditorProps<PostsPageSectionData>>;

export type PostsPageTemplateEntry = {
    id: PostsPageTemplateId;
    label: string;
    description: string;
    Editor: SectionEditorComponent;
};

const postsOnlyRegistry: Record<"posts-list" | "rss-feed", PostsPageTemplateEntry> = {
    "posts-list": {
        id: "posts-list",
        label: POSTS_PAGE_TEMPLATE_DEFS["posts-list"].label,
        description: POSTS_PAGE_TEMPLATE_DEFS["posts-list"].description,
        Editor: PostsListSectionEditor as SectionEditorComponent,
    },
    "rss-feed": {
        id: "rss-feed",
        label: POSTS_PAGE_TEMPLATE_DEFS["rss-feed"].label,
        description: POSTS_PAGE_TEMPLATE_DEFS["rss-feed"].description,
        Editor: RssFeedSectionEditor as SectionEditorComponent,
    },
};

export function getPostsPageRegistryEntry(
    templateId: PostsPageTemplateId
): PostsPageTemplateEntry | null {
    if (templateId === "posts-list" || templateId === "rss-feed") {
        return postsOnlyRegistry[templateId];
    }
    const home = HOME_SECTION_REGISTRY[templateId as HomeSectionTemplateId];
    if (!home) return null;
    return {
        id: templateId,
        label: home.label,
        description: home.description,
        Editor: home.Editor as SectionEditorComponent,
    };
}

export const POSTS_PAGE_ADD_TEMPLATE_IDS: PostsPageTemplateId[] = [
    "rss-feed",
    "banner",
    "text-block",
    "card-grid",
    "tag-list",
    "contact",
];

export function getAddTemplateLabel(templateId: PostsPageTemplateId): string {
    if (templateId === "posts-list" || templateId === "rss-feed") {
        return POSTS_PAGE_TEMPLATE_DEFS[templateId].label;
    }
    return HOME_SECTION_TEMPLATE_DEFS[templateId as HomeSectionTemplateId].label;
}
