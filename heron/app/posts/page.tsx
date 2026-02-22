import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Post } from "@/lib/api";

export const dynamic = "force-dynamic";

function formatPostDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export default async function PostsPage() {
  const postsData = await serverFetch<Post[]>("/posts");
  const posts = postsData || [];

  return (
    <div className="grid gap-8">
      <h1 className="m-0 text-3xl font-bold text-chestnut dark:text-dark-text">Posts</h1>
      {posts.length === 0 ? (
        <div className="rounded-xl border border-desert-tan-dark bg-surface p-8 text-center dark:border-dark-muted dark:bg-dark-surface">
          <p className="text-olive-dark dark:text-dark-muted">
            No posts yet. Check back soon for new content.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group rounded-xl border border-desert-tan-dark bg-surface p-6 shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:border-caramel hover:shadow-[0_8px_24px_rgba(72,9,3,0.12)] dark:border-dark-muted dark:bg-dark-surface dark:hover:border-caramel/50 dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <time
                  dateTime={post.published_at || post.created_at}
                  className="rounded-full bg-desert-tan/50 px-2.5 py-0.5 text-xs font-medium text-chestnut-dark dark:bg-dark-muted/40 dark:text-dark-text"
                >
                  {formatPostDate(post.published_at || post.created_at)}
                </time>
              </div>
              <h2 className="text-xl font-semibold leading-tight text-chestnut dark:text-dark-text">
                {post.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-[0.98rem] leading-relaxed text-chestnut-dark dark:text-dark-muted">
                {post.summary}
              </p>
              <Link
                href={`/posts/${post.slug}`}
                className="mt-5 inline-block font-medium text-copper transition-colors hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
