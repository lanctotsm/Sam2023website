import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { serverFetch } from "@/lib/server";
import type { Post } from "@/lib/api";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  try {
    const post = await serverFetch<Post>(`/posts/slug/${slug}`);
    return (
      <article className="stack">
        <h1>{post.title}</h1>
        {post.summary && <p>{post.summary}</p>}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
      </article>
    );
  } catch {
    notFound();
  }
}
