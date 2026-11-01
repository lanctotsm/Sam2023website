import type { ComponentType } from "react";
import type { HomeSection, HomeSectionTemplateData, HomeSectionTemplateId, RecentWorkSectionData } from "@/lib/frontPageDefaults";
import { BannerSectionView } from "@/components/home/templates/BannerSectionView";
import { TextBlockSectionView } from "@/components/home/templates/TextBlockSectionView";
import { CardGridSectionView } from "@/components/home/templates/CardGridSectionView";
import { TagListSectionView } from "@/components/home/templates/TagListSectionView";
import { ContactSectionView } from "@/components/home/templates/ContactSectionView";
import { RecentWorkSectionView } from "@/components/home/templates/RecentWorkSectionView";

type SectionViewProps = { data: HomeSectionTemplateData };
type SyncTemplateId = Exclude<HomeSectionTemplateId, "recent-work">;

/**
 * Public homepage views only. Do not import this from a client component —
 * that would pull the views, and the server icon map, into the reader bundle.
 * The admin settings tab imports its own editor registry.
 * Recent work reads published albums and posts on the server.
 */
const VIEWS: Record<SyncTemplateId, ComponentType<SectionViewProps>> = {
    banner: BannerSectionView as ComponentType<SectionViewProps>,
    "text-block": TextBlockSectionView as ComponentType<SectionViewProps>,
    "card-grid": CardGridSectionView as ComponentType<SectionViewProps>,
    "tag-list": TagListSectionView as ComponentType<SectionViewProps>,
    contact: ContactSectionView as ComponentType<SectionViewProps>,
};

export function HomeSectionView({ section }: { section: HomeSection }) {
    if (section.templateId === "recent-work") {
        return <RecentWorkSectionView data={section.data as RecentWorkSectionData} />;
    }
    const View = VIEWS[section.templateId];
    if (!View) return null;
    return <View data={section.data} />;
}
