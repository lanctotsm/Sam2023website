import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Post } from "@/lib/api";

export default async function PostsPage() {
  const posts = await serverFetch<Post[]>("/posts");

  return (
    <div className="stack">
      <h1>Posts</h1>
      <div className="grid">
        {posts.map((post) => (
          <article className="card" key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.summary}</p>
            <Link href={`/posts/${post.slug}`}>Read more</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
