"use client";

import type { ComponentType } from "react";
import type { HomeSectionTemplateId } from "@/lib/homeSectionTemplates/types";
import type {
    PostsPageSection,
    PostsPageSectionData,
    PostsPageTemplateId,
} from "@/lib/postsPage";
import { POSTS_PAGE_TEMPLATE_DEFS } from "@/lib/postsPage";
import { HOME_SECTION_REGISTRY } from "@/components/home/sectionRegistry";
import { HOME_SECTION_TEMPLATE_DEFS } from "@/lib/homeSectionTemplates/definitions";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import {
    PostsListSectionView,
    PostsListSectionEditor,
} from "@/components/posts/templates/PostsListSection";
import { RssFeedSectionView, RssFeedSectionEditor } from "@/components/posts/templates/RssFeedSection";

type SectionViewProps = { data: PostsPageSectionData };
type SectionEditorComponent = ComponentType<SectionEditorProps<PostsPageSectionData>>;

export type PostsPageTemplateEntry = {
    id: PostsPageTemplateId;
    label: string;
    description: string;
    View: ComponentType<SectionViewProps>;
    Editor: SectionEditorComponent;
};

const postsOnlyRegistry: Record<"posts-list" | "rss-feed", PostsPageTemplateEntry> = {
    "posts-list": {
        id: "posts-list",
        label: POSTS_PAGE_TEMPLATE_DEFS["posts-list"].label,
        description: POSTS_PAGE_TEMPLATE_DEFS["posts-list"].description,
        View: PostsListSectionView as ComponentType<SectionViewProps>,
        Editor: PostsListSectionEditor as SectionEditorComponent,
    },
    "rss-feed": {
        id: "rss-feed",
        label: POSTS_PAGE_TEMPLATE_DEFS["rss-feed"].label,
        description: POSTS_PAGE_TEMPLATE_DEFS["rss-feed"].description,
        View: RssFeedSectionView as ComponentType<SectionViewProps>,
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
        View: home.View as ComponentType<SectionViewProps>,
        Editor: home.Editor as SectionEditorComponent,
    };
}

export function PostsPageSectionView({ section }: { section: PostsPageSection }) {
    const entry = getPostsPageRegistryEntry(section.templateId);
    if (!entry) return null;
    const View = entry.View;
    return <View data={section.data} />;
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
