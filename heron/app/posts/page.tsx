import { Suspense } from "react";
import { connection } from "next/server";
import { getSetting } from "@/services/settings";
import { parsePostsPageConfig } from "@/lib/postsPage";
import PageStyleProvider from "@/components/PageStyleProvider";
import PostsPageContent from "@/components/posts/PostsPageContent";
import { getCachedPublicPosts } from "@/services/public-content";
import { publicPageMetadata } from "@/lib/site-metadata";

export const metadata = publicPageMetadata({
    title: "Posts — Samuel Lanctot",
    description: "Writing about software engineering, creative projects, and photography by Samuel Lanctot.",
    path: "/posts"
});

export default function PostsPage() {
    return (
        <Suspense fallback={null}>
            <PostsContent />
        </Suspense>
    );
}

async function PostsContent() {
    await connection();
    const raw = await getSetting("posts_page");
    const config = parsePostsPageConfig(raw);
    const posts = config.showPosts ? await getCachedPublicPosts() : [];

    return (
        <PageStyleProvider page="posts">
            <PostsPageContent config={config} posts={posts} />
        </PageStyleProvider>
    );
}
