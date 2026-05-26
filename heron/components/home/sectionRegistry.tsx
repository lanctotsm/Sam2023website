"use client";

import type { ComponentType } from "react";
import type { HomeSection, HomeSectionTemplateData, HomeSectionTemplateId } from "@/lib/frontPageDefaults";
import { HOME_SECTION_TEMPLATE_DEFS } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import { BannerSectionView, BannerSectionEditor } from "@/components/home/templates/BannerSection";
import { TextBlockSectionView, TextBlockSectionEditor } from "@/components/home/templates/TextBlockSection";
import { CardGridSectionView, CardGridSectionEditor } from "@/components/home/templates/CardGridSection";
import { TagListSectionView, TagListSectionEditor } from "@/components/home/templates/TagListSection";
import { ContactSectionView, ContactSectionEditor } from "@/components/home/templates/ContactSection";

type SectionViewProps = { data: HomeSectionTemplateData };
type SectionEditorComponent = ComponentType<SectionEditorProps<HomeSectionTemplateData>>;

export type HomeSectionTemplateEntry = {
    id: HomeSectionTemplateId;
    label: string;
    description: string;
    View: ComponentType<SectionViewProps>;
    Editor: SectionEditorComponent;
};

export const HOME_SECTION_REGISTRY: Record<HomeSectionTemplateId, HomeSectionTemplateEntry> = {
    banner: {
        id: "banner",
        label: HOME_SECTION_TEMPLATE_DEFS.banner.label,
        description: HOME_SECTION_TEMPLATE_DEFS.banner.description,
        View: BannerSectionView as ComponentType<SectionViewProps>,
        Editor: BannerSectionEditor as SectionEditorComponent,
    },
    "text-block": {
        id: "text-block",
        label: HOME_SECTION_TEMPLATE_DEFS["text-block"].label,
        description: HOME_SECTION_TEMPLATE_DEFS["text-block"].description,
        View: TextBlockSectionView as ComponentType<SectionViewProps>,
        Editor: TextBlockSectionEditor as SectionEditorComponent,
    },
    "card-grid": {
        id: "card-grid",
        label: HOME_SECTION_TEMPLATE_DEFS["card-grid"].label,
        description: HOME_SECTION_TEMPLATE_DEFS["card-grid"].description,
        View: CardGridSectionView as ComponentType<SectionViewProps>,
        Editor: CardGridSectionEditor as SectionEditorComponent,
    },
    "tag-list": {
        id: "tag-list",
        label: HOME_SECTION_TEMPLATE_DEFS["tag-list"].label,
        description: HOME_SECTION_TEMPLATE_DEFS["tag-list"].description,
        View: TagListSectionView as ComponentType<SectionViewProps>,
        Editor: TagListSectionEditor as SectionEditorComponent,
    },
    contact: {
        id: "contact",
        label: HOME_SECTION_TEMPLATE_DEFS.contact.label,
        description: HOME_SECTION_TEMPLATE_DEFS.contact.description,
        View: ContactSectionView as ComponentType<SectionViewProps>,
        Editor: ContactSectionEditor as SectionEditorComponent,
    },
};

export function HomeSectionView({ section }: { section: HomeSection }) {
    const entry = HOME_SECTION_REGISTRY[section.templateId];
    if (!entry) return null;
    const View = entry.View;
    return <View data={section.data} />;
}
