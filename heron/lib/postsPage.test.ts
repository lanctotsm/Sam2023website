import { describe, expect, it } from "vitest";
import {
    createDefaultPostsPageConfig,
    DEFAULT_POSTS_LIST_SECTION_ID,
    parsePostsPageConfig,
} from "@/lib/postsPage";

describe("parsePostsPageConfig", () => {
    it("defaults to showPosts true with posts-list section", () => {
        const config = parsePostsPageConfig(null);
        expect(config.showPosts).toBe(true);
        expect(config.sections.some((s) => s.templateId === "posts-list")).toBe(true);
        expect(config.sectionOrder).toContain(DEFAULT_POSTS_LIST_SECTION_ID);
    });

    it("preserves showPosts false and still has posts-list", () => {
        const raw = JSON.stringify({
            showPosts: false,
            sections: [
                {
                    id: DEFAULT_POSTS_LIST_SECTION_ID,
                    templateId: "posts-list",
                    label: "Posts",
                    removable: false,
                    data: { heading: "Posts" },
                },
                {
                    id: "feed-1",
                    templateId: "rss-feed",
                    label: "Watches",
                    data: { title: "Recent watches", feedUrl: "https://letterboxd.com/user/rss/" },
                },
            ],
            sectionOrder: ["feed-1", DEFAULT_POSTS_LIST_SECTION_ID],
        });
        const config = parsePostsPageConfig(raw);
        expect(config.showPosts).toBe(false);
        expect(config.sections.find((s) => s.templateId === "posts-list")).toBeDefined();
        expect(config.sectionOrder[0]).toBe("feed-1");
    });

    it("re-inserts posts-list if missing from hand-edited JSON", () => {
        const raw = JSON.stringify({
            showPosts: true,
            sections: [
                {
                    id: "feed-1",
                    templateId: "rss-feed",
                    label: "Feed",
                    data: { title: "Feed", feedUrl: "https://example.com/rss.xml" },
                },
            ],
            sectionOrder: ["feed-1"],
        });
        const config = parsePostsPageConfig(raw);
        expect(config.sections.some((s) => s.templateId === "posts-list")).toBe(true);
    });

    it("keeps https feed URLs", () => {
        const raw = JSON.stringify({
            showPosts: true,
            sections: createDefaultPostsPageConfig().sections.concat({
                id: "feed-ok",
                templateId: "rss-feed" as const,
                label: "Feed",
                removable: true,
                data: { title: "Feed", feedUrl: "https://example.com/rss.xml" },
            }),
            sectionOrder: [DEFAULT_POSTS_LIST_SECTION_ID, "feed-ok"],
        });
        const config = parsePostsPageConfig(raw);
        const feed = config.sections.find((s) => s.id === "feed-ok");
        expect((feed?.data as { feedUrl: string }).feedUrl).toBe("https://example.com/rss.xml");
    });
});
