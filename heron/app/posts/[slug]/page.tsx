import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { serverFetch } from "@/lib/server";
import type { Post } from "@/lib/api";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

function formatPostDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function estimateReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let post: Post;
  try {
    post = await serverFetch<Post>(`/posts/slug/${slug}`);
  } catch {
    notFound();
  }

  const publishedDate = formatPostDate(post.published_at || post.created_at);
  const readingTime = estimateReadingTime(post.markdown);

  return (
    <article className="post-article">
      <Link
        href="/posts"
        className="post-article__back"
      >
        ← Back to Posts
      </Link>

      <section className="card">
        <header className="post-article__header">
          <h1 className="post-article__title">
            {post.title}
          </h1>
          {post.summary && (
            <p className="post-article__summary">
              {post.summary}
            </p>
          )}
          <div className="post-article__meta">
            {publishedDate && (
              <time dateTime={post.published_at || post.created_at} className="post-article__date">
                {publishedDate}
              </time>
            )}
            {publishedDate && <span className="post-article__divider" aria-hidden>·</span>}
            <span className="post-article__reading-time">
              {readingTime} min read
            </span>
          </div>
        </header>

        <div className="prose prose-lg post-article__content dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
        </div>
      </section>
    </article>
  );
}
