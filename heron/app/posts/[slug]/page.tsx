import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { serverFetch } from "@/lib/server";
import type { Post } from "@/lib/api";
import { renderWithShortcodes } from "@/lib/shortcodes";
import { formatPostDate } from "@/lib/format-post-date";
import { POST_SEO_META_KEY_SET } from "@/lib/post-seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let post: Post;
  try {
    post = await serverFetch<Post>(`/posts/slug/${slug}`);
  } catch {
    return {};
  }

  const meta = post.metadata ?? {};
  const title = meta.seo_title || post.title;
  const description = meta.seo_description || post.summary || "";

  const metadata: Metadata = { title, description };

  const ogTitle = meta.og_title || title;
  const ogDescription = meta.og_description || description;
  metadata.openGraph = { title: ogTitle, description: ogDescription };
  if (meta.og_image) {
    metadata.openGraph.images = [{ url: meta.og_image }];
  }

  if (meta.twitter_card) {
    metadata.twitter = {
      card: meta.twitter_card as "summary" | "summary_large_image" | "player" | "app",
      title: ogTitle,
      description: ogDescription
    };
    if (meta.og_image && metadata.twitter) {
      metadata.twitter.images = [meta.og_image];
    }
  }

  if (meta.canonical_url) {
    metadata.alternates = { canonical: meta.canonical_url };
  }

  if (meta.author) {
    metadata.authors = [{ name: meta.author }];
  }

  if (meta.keywords) {
    metadata.keywords = meta.keywords.split(",").map((k) => k.trim());
  }

  if (meta.robots) {
    metadata.robots = meta.robots;
  }

  return metadata;
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

  const publishedDate = formatPostDate(post.published_at || post.created_at, "long");
  const readingTime = estimateReadingTime(post.markdown);

  return (
    <article className="mx-auto grid w-full max-w-3xl gap-6">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-copper transition-colors hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan"
      >
        ← Back to Posts
      </Link>
      <div className="surface-card">
        <header className="mb-6">
          <h1 className="font-bold text-chestnut dark:text-dark-text">
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
          {post.metadata && Object.keys(post.metadata).length > 0 && (() => {
            const customEntries = Object.entries(post.metadata).filter(([key]) => !POST_SEO_META_KEY_SET.has(key));
            if (customEntries.length === 0) return null;
            return (
              <div className="mt-5 flex flex-wrap gap-2">
                {customEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 rounded-md border border-desert-tan-dark bg-white px-2 py-1 text-xs font-medium text-chestnut dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text"
                  >
                    <span className="text-olive dark:text-dark-muted">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <hr className="mt-6 border-hairline dark:border-dark-hairline" />
        </header>
        <div className="markdown-body text-chestnut-dark dark:text-dark-text">
          {await renderWithShortcodes(post.markdown)}
        </div>
      </div>
    </article>
  );
}
