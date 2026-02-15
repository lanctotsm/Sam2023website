import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Post } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const postsData = await serverFetch<Post[]>("/posts");
  const posts = postsData || [];

  return (
    <div className="grid gap-4">
      <h1 className="text-chestnut">Posts</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
            <h2 className="text-chestnut">{post.title}</h2>
            <p className="mt-2 text-chestnut-dark">{post.summary}</p>
            <Link href={`/posts/${post.slug}`} className="mt-2 inline-block font-medium text-copper hover:text-chestnut">Read more</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
