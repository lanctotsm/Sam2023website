/** Data shapes for each home section template (stored in `front_page` JSON). */

export type BannerSectionData = {
    title: string;
    subtitle: string;
    backgroundType: "gradient" | "color" | "image";
    backgroundColor: string;
    backgroundImage: string;
    gradientFrom: string;
    gradientTo: string;
};

export type TextBlockSectionData = {
    heading: string;
    paragraphs: string[];
};

export type CardItem = {
    icon: string;
    title: string;
    text: string;
};

export type CardGridSectionData = {
    heading: string;
    columns: number;
    items: CardItem[];
};

export type TagItem = {
    icon: string;
    label: string;
};

export type TagListSectionData = {
    heading: string;
    items: TagItem[];
};

export type ContactLink = {
    icon: string;
    label: string;
    url: string;
};

export type ContactSectionData = {
    heading: string;
    text: string;
    showSocials: boolean;
    links: ContactLink[];
};

export type HomeSectionTemplateId = "banner" | "text-block" | "card-grid" | "tag-list" | "contact";

export type HomeSectionTemplateData =
    | BannerSectionData
    | TextBlockSectionData
    | CardGridSectionData
    | TagListSectionData
    | ContactSectionData;
