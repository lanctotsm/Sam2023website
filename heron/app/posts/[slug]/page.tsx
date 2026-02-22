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
    <article className="mx-auto grid w-full max-w-3xl gap-6">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-copper transition-colors hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan"
      >
        ← Back to Posts
      </Link>
      <div className="rounded-xl border border-desert-tan-dark bg-surface p-6 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold leading-tight text-chestnut dark:text-dark-text md:text-4xl">
            {post.title}
          </h1>
          {post.summary && (
            <p className="mt-3 text-lg leading-relaxed text-chestnut-dark dark:text-dark-muted">
              {post.summary}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-medium text-olive-dark dark:text-dark-muted">
            {publishedDate && (
              <time dateTime={post.published_at || post.created_at} className="rounded-full bg-desert-tan/50 px-2.5 py-0.5 dark:bg-dark-muted/40 dark:text-dark-text">
                {publishedDate}
              </time>
            )}
            {publishedDate && <span aria-hidden>·</span>}
            <span className="rounded-full bg-desert-tan/50 px-2.5 py-0.5 dark:bg-dark-muted/40 dark:text-dark-text">
              {readingTime} min read
            </span>
          </div>
        </header>
        <div className="prose prose-lg max-w-none leading-relaxed prose-headings:text-chestnut prose-p:text-chestnut-dark prose-li:text-chestnut-dark dark:prose-headings:text-dark-text dark:prose-p:text-dark-muted dark:prose-strong:text-dark-text dark:prose-li:text-dark-muted dark:prose-a:text-caramel-light dark:prose-a:hover:text-desert-tan">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
