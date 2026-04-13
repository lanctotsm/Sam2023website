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
        <h1 className="m-0 text-3xl font-bold text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, inherit)" }}>Posts</h1>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] p-8 text-center dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))]">
            <p className="text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]" style={{ fontFamily: "var(--page-body-font, inherit)" }}>
              No posts yet. Check back soon for new content.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group rounded-xl border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(72,9,3,0.12)] dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <time
                    dateTime={post.published_at || post.created_at}
                    className="rounded-full bg-desert-tan/50 px-2.5 py-0.5 text-xs font-medium text-chestnut-dark dark:bg-dark-muted/40 dark:text-dark-text"
                  >
                    {formatPostDate(post.published_at || post.created_at)}
                  </time>
                </div>
                <h2 className="text-xl font-semibold leading-tight text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]" style={{ fontFamily: "var(--page-heading-font, inherit)" }}>
                  {post.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-[0.98rem] leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]" style={{ fontFamily: "var(--page-body-font, inherit)" }}>
                  {post.summary}
                </p>
                <Link
                  href={`/posts/${post.slug}`}
                  className="mt-5 inline-block font-medium text-[var(--page-link-color,var(--color-copper))] transition-colors hover:opacity-80 dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]"
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
