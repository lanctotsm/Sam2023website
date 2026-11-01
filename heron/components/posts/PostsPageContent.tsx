import type { Post } from "@/lib/api";
import { HomeSectionView } from "@/components/home/sectionRegistry";
import type { HomeSection } from "@/lib/frontPageDefaults";
import type {
    PostsListSectionData,
    PostsPageSection,
    PostsPageSettings,
    RssFeedSectionData,
} from "@/lib/postsPage";
import { findPostsPageSection, isHomeTemplateId } from "@/lib/postsPage";
import PostsListSectionView from "./PostsListSectionView";
import RssFeedSectionView from "./RssFeedSectionView";

type Props = {
    config: PostsPageSettings;
    posts: Post[];
};

async function renderSection(section: PostsPageSection, posts: Post[]) {
    if (section.templateId === "posts-list") {
        return (
            <PostsListSectionView
                key={section.id}
                data={section.data as PostsListSectionData}
                posts={posts}
            />
        );
    }

    if (section.templateId === "rss-feed") {
        return (
            <RssFeedSectionView key={section.id} data={section.data as RssFeedSectionData} />
        );
    }

    if (isHomeTemplateId(section.templateId)) {
        const homeSection: HomeSection = {
            id: section.id,
            templateId: section.templateId,
            label: section.label,
            removable: section.removable,
            data: section.data as HomeSection["data"],
        };
        return (
            <div key={section.id}>
                <HomeSectionView section={homeSection} />
            </div>
        );
    }

    return null;
}

export default async function PostsPageContent({ config, posts }: Props) {
    const sectionsToRender = config.sectionOrder
        .map((id) => findPostsPageSection(config, id))
        .filter((s): s is PostsPageSection => Boolean(s));

    const hasVisiblePostsList =
        config.showPosts && sectionsToRender.some((s) => s.templateId === "posts-list");

    const postsForList = hasVisiblePostsList ? posts : [];

    const rendered = await Promise.all(
        sectionsToRender.map(async (section) => {
            if (section.templateId === "posts-list" && !config.showPosts) {
                return null;
            }
            return renderSection(section, postsForList);
        })
    );

    return <div className="grid gap-10">{rendered.filter(Boolean)}</div>;
}
