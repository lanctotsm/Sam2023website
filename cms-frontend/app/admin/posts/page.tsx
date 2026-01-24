"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Post } from "@/lib/api";
import { apiFetch, createPost } from "@/lib/api";

const emptyPost = {
  title: "",
  slug: "",
  summary: "",
  markdown: "",
  status: "draft"
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState(emptyPost);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Post[]>("/posts?status=all")
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const created = await createPost(form);
      setPosts((prev) => [created, ...prev]);
      setForm(emptyPost);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Create Post</h2>
        <label>Title</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>Slug</label>
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <label>Summary</label>
        <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <label>Markdown</label>
        <textarea
          rows={10}
          value={form.markdown}
          onChange={(e) => setForm({ ...form, markdown: e.target.value })}
        />
        <label>Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button disabled={loading} onClick={submit}>
          {loading ? "Saving..." : "Create Post"}
        </button>
      </section>

      <section className="stack">
        <h2>Existing Posts</h2>
        {posts.map((post) => (
          <article className="card" key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
          </article>
        ))}
      </section>
    </div>
  );
}
