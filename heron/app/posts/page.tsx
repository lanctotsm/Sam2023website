import { getSetting } from "@/services/settings";
import { getAllPosts } from "@/services/posts";
import { serializePost } from "@/lib/serializers";
import { parsePostsPageConfig } from "@/lib/postsPage";
import PageStyleProvider from "@/components/PageStyleProvider";
import PostsPageContent from "@/components/posts/PostsPageContent";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
    const raw = await getSetting("posts_page");
    const config = parsePostsPageConfig(raw);

    let posts: ReturnType<typeof serializePost>[] = [];
    if (config.showPosts) {
        const rows = await getAllPosts({});
        posts = rows.map((row) => serializePost(row));
    }

    return (
        <PageStyleProvider page="posts">
            <PostsPageContent config={config} posts={posts} />
        </PageStyleProvider>
    );
}
