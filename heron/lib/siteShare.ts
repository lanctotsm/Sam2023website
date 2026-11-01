import {
    parseFrontPageConfig,
    type BannerSectionData,
    type ContactLink,
    type ContactSectionData,
    type FrontPageSettings,
} from "@/lib/frontPageDefaults";
import { safeHttpUrl } from "@/lib/safe-url";

/** Link-preview description. A saved description wins; otherwise the banner subtitle. */
export function siteDescription(descriptionSetting: string | null | undefined, frontRaw: string | null | undefined): string {
    const custom = descriptionSetting?.trim() ?? "";
    if (custom) return custom;
    const config = parseFrontPageConfig(frontRaw ?? null);
    return bannerSubtitle(config);
}

export function bannerSubtitle(config: FrontPageSettings): string {
    for (const id of config.sectionOrder) {
        const section = config.sections.find((item) => item.id === id);
        if (section?.templateId === "banner") return (section.data as BannerSectionData).subtitle.trim();
    }
    return "";
}

/** Share image. A saved URL wins; otherwise the caller passes the newest album cover. */
export function ogImageUrl(imageSetting: string | null | undefined, coverUrl: string | null | undefined): string | null {
    const custom = imageSetting?.trim() ?? "";
    if (custom) return custom;
    const cover = coverUrl?.trim() ?? "";
    return cover || null;
}

/** Contact links from the first contact section, in homepage order. */
export function contactLinksFromFrontPage(frontRaw: string | null | undefined): ContactLink[] {
    const config = parseFrontPageConfig(frontRaw ?? null);
    for (const id of config.sectionOrder) {
        const section = config.sections.find((item) => item.id === id);
        if (section?.templateId !== "contact") continue;
        const data = section.data as ContactSectionData;
        if (!data.showSocials) return [];
        return data.links.flatMap((link) => {
            const url = safeHttpUrl(link.url);
            if (!link.label.trim() || !url) return [];
            return [{ ...link, url }];
        });
    }
    return [];
}
