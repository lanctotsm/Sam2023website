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
    <article className="grid gap-6">
      <header className="section-header">
        <h1 className="section-header__title">Posts</h1>
      </header>

      {posts.length === 0 ? (
        <section className="card empty-state">
          <p className="empty-state__text">
            No posts yet. Check back soon for new content.
          </p>
        </section>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <section
              key={post.id}
              className="card post-card"
            >
              <div className="post-card__meta">
                <time
                  dateTime={post.published_at || post.created_at}
                  className="post-card__date"
                >
                  {formatPostDate(post.published_at || post.created_at)}
                </time>
              </div>
              <h2 className="post-card__title">
                {post.title}
              </h2>
              <p className="post-card__summary">
                {post.summary}
              </p>
              <Link
                href={`/posts/${post.slug}`}
                className="post-card__action"
              >
                Read more →
              </Link>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
