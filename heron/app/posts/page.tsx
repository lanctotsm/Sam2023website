import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Post } from "@/lib/api";
import PageStyleProvider from "@/components/PageStyleProvider";

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
    <PageStyleProvider page="posts">
      <div className="grid gap-8">
        <h1 className="heading-rule m-0 font-bold text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, var(--font-display))" }}>Posts</h1>
        {posts.length === 0 ? (
          <div className="surface-card text-center">
            <p className="text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]" style={{ fontFamily: "var(--page-body-font, inherit)" }}>
              No posts yet. Check back soon for new content.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="surface-card group transition-all hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:shadow-none"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <time
                    dateTime={post.published_at || post.created_at}
                    className="rounded-full bg-desert-tan/50 px-2.5 py-0.5 text-xs font-medium text-chestnut-dark dark:bg-dark-muted/40 dark:text-dark-text"
                  >
                    {formatPostDate(post.published_at || post.created_at)}
                  </time>
                </div>
                <h2 className="text-xl font-semibold leading-tight text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, var(--font-display))" }}>
                  {post.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-[0.98rem] leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]" style={{ fontFamily: "var(--page-body-font, inherit)" }}>
                  {post.summary}
                </p>
                <Link
                  href={`/posts/${post.slug}`}
                  className="mt-4 inline-flex min-h-[44px] items-center font-medium text-[var(--page-link-color,var(--color-copper))] transition-colors hover:opacity-80 dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageStyleProvider>
  );
}
