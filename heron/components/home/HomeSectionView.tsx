import type { ComponentType } from "react";
import type { HomeSection, HomeSectionTemplateData, HomeSectionTemplateId } from "@/lib/frontPageDefaults";
import { BannerSectionView } from "./templates/BannerSection";
import { TextBlockSectionView } from "./templates/TextBlockSection";
import { CardGridSectionView } from "./templates/CardGridSection";
import { TagListSectionView } from "./templates/TagListSection";
import { ContactSectionView } from "./templates/ContactSection";

// Public rendering must not import the client registry or its editor controls.
const sectionViews = {
    banner: BannerSectionView,
    "text-block": TextBlockSectionView,
    "card-grid": CardGridSectionView,
    "tag-list": TagListSectionView,
    contact: ContactSectionView,
} as Record<HomeSectionTemplateId, ComponentType<{ data: HomeSectionTemplateData }>>;

export function HomeSectionView({ section }: { section: HomeSection }) {
    const View = sectionViews[section.templateId];
    if (!View) return null;
    return <View data={section.data} />;
}
