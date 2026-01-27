"use client";

import { useEffect, useState } from "react";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    try {
      const data = await apiFetch<Post[]>("/posts");
      setPosts(data || []);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (editingId) {
        // Update existing post
        const updated = await apiFetch<Post>(`/posts/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        setPosts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        setEditingId(null);
      } else {
        // Create new post
        const created = await createPost(form);
        setPosts((prev) => [created, ...prev]);
      }
      setForm(emptyPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      summary: post.summary || "",
      markdown: post.markdown,
      status: post.status
    });
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await apiFetch(`/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyPost);
    setError("");
  };

  return (
    <div className="stack">
      <section className="card stack">
        <h2>{editingId ? "Edit Post" : "Create Post"}</h2>
        <label>Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Post title"
        />
        <label>Slug</label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="post-url-slug"
        />
        <label>Summary</label>
        <textarea
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="Brief summary of the post"
          rows={2}
        />
        <label>Content (Markdown)</label>
        <textarea
          rows={12}
          value={form.markdown}
          onChange={(e) => setForm({ ...form, markdown: e.target.value })}
          placeholder="Write your post content in markdown..."
        />
        <label>Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        {error && <p className="error">{error}</p>}
        <div className="button-row">
          <button disabled={loading} onClick={handleSubmit}>
            {loading ? "Saving..." : editingId ? "Update Post" : "Create Post"}
          </button>
          {editingId && (
            <button className="secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="stack">
        <h2>All Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="card muted">No posts yet. Create your first post above.</p>
        ) : (
          <div className="admin-list">
            {posts.map((post) => (
              <article className="card admin-list-item" key={post.id}>
                <div className="admin-list-content">
                  <h3>{post.title}</h3>
                  <p className="muted">{post.summary || "No summary"}</p>
                  <div className="admin-meta">
                    <span className={`status-badge status-${post.status}`}>{post.status}</span>
                    <span className="muted">/{post.slug}</span>
                  </div>
                </div>
                <div className="admin-actions">
                  <button className="secondary" onClick={() => handleEdit(post)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
