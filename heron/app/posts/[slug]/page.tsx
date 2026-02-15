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
      <article className="grid gap-4">
        <h1 className="text-chestnut">{post.title}</h1>
        {post.summary && <p className="text-chestnut-dark">{post.summary}</p>}
        <div className="prose max-w-none prose-headings:text-chestnut prose-p:text-chestnut-dark">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
        </div>
      </article>
    );
  } catch {
    notFound();
  }
}
