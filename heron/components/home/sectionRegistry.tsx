"use client";

import type { ComponentType } from "react";
import type { HomeSectionTemplateData, HomeSectionTemplateId } from "@/lib/frontPageDefaults";
import { HOME_SECTION_TEMPLATE_DEFS } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import { BannerSectionEditor } from "@/components/home/editors/BannerSectionEditor";
import { TextBlockSectionEditor } from "@/components/home/editors/TextBlockSectionEditor";
import { CardGridSectionEditor } from "@/components/home/editors/CardGridSectionEditor";
import { TagListSectionEditor } from "@/components/home/editors/TagListSectionEditor";
import { ContactSectionEditor } from "@/components/home/editors/ContactSectionEditor";

type SectionEditorComponent = ComponentType<SectionEditorProps<HomeSectionTemplateData>>;

export type HomeSectionTemplateEntry = {
    id: HomeSectionTemplateId;
    label: string;
    description: string;
    Editor: SectionEditorComponent;
};

export const HOME_SECTION_REGISTRY: Record<HomeSectionTemplateId, HomeSectionTemplateEntry> = {
    banner: {
        id: "banner",
        label: HOME_SECTION_TEMPLATE_DEFS.banner.label,
        description: HOME_SECTION_TEMPLATE_DEFS.banner.description,
        Editor: BannerSectionEditor as SectionEditorComponent,
    },
    "text-block": {
        id: "text-block",
        label: HOME_SECTION_TEMPLATE_DEFS["text-block"].label,
        description: HOME_SECTION_TEMPLATE_DEFS["text-block"].description,
        Editor: TextBlockSectionEditor as SectionEditorComponent,
    },
    "card-grid": {
        id: "card-grid",
        label: HOME_SECTION_TEMPLATE_DEFS["card-grid"].label,
        description: HOME_SECTION_TEMPLATE_DEFS["card-grid"].description,
        Editor: CardGridSectionEditor as SectionEditorComponent,
    },
    "tag-list": {
        id: "tag-list",
        label: HOME_SECTION_TEMPLATE_DEFS["tag-list"].label,
        description: HOME_SECTION_TEMPLATE_DEFS["tag-list"].description,
        Editor: TagListSectionEditor as SectionEditorComponent,
    },
    contact: {
        id: "contact",
        label: HOME_SECTION_TEMPLATE_DEFS.contact.label,
        description: HOME_SECTION_TEMPLATE_DEFS.contact.description,
        Editor: ContactSectionEditor as SectionEditorComponent,
    },
};
