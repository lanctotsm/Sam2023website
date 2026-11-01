/** Data shapes for each home section template (stored in `front_page` JSON). */

export type BannerVariant = "panel" | "band" | "canvas";

export type BannerSectionData = {
    title: string;
    subtitle: string;
    backgroundType: "gradient" | "color" | "image";
    backgroundColor: string;
    backgroundImage: string;
    gradientFrom: string;
    gradientTo: string;
    /** Empty or unknown values are stored as `panel` (the original rounded block). */
    variant: BannerVariant;
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

export type RecentWorkSectionData = {
    heading: string;
    albumLimit: number;
    postLimit: number;
    showAlbums: boolean;
    showPosts: boolean;
};

export type HomeSectionTemplateId =
    | "banner"
    | "text-block"
    | "card-grid"
    | "tag-list"
    | "contact"
    | "recent-work";

export type HomeSectionTemplateData =
    | BannerSectionData
    | TextBlockSectionData
    | CardGridSectionData
    | TagListSectionData
    | ContactSectionData
    | RecentWorkSectionData;
