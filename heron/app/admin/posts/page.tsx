"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
      toast.success(editingId ? "Post updated." : "Post created.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save post";
      setError(msg);
      toast.error(msg);
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
    toast("Are you sure you want to delete this post?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await apiFetch(`/posts/${postId}`, { method: "DELETE" });
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            toast.success("Post deleted.");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delete post";
            setError(msg);
            toast.error(msg);
          }
        }
      },
      cancel: { label: "Cancel", onClick: () => {} }
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyPost);
    setError("");
  };

  const inputClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10";
  const labelClass = "text-sm font-medium text-chestnut-dark";
  const cardClass =
    "rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]";

  return (
    <div className="flex flex-col gap-6">
      <section className={`${cardClass} flex flex-col gap-4`}>
        <h2 className="m-0 text-chestnut">{editingId ? "Edit Post" : "Create Post"}</h2>
        <label className={labelClass}>Title</label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Post title"
        />
        <label className={labelClass}>Slug</label>
        <input
          className={inputClass}
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="post-url-slug"
        />
        <label className={labelClass}>Summary</label>
        <textarea
          className={inputClass}
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="Brief summary of the post"
          rows={2}
        />
        <label className={labelClass}>Content (Markdown)</label>
        <textarea
          className={inputClass}
          rows={12}
          value={form.markdown}
          onChange={(e) => setForm({ ...form, markdown: e.target.value })}
          placeholder="Write your post content in markdown..."
        />
        <label className={labelClass}>Status</label>
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        {error && <p className="text-copper text-sm">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Saving..." : editingId ? "Update Post" : "Create Post"}
          </button>
          {editingId && (
            <button
              className="rounded-lg border border-chestnut bg-transparent px-4 py-2.5 text-chestnut transition hover:bg-chestnut/5"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-chestnut">All Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className={`${cardClass} text-olive`}>No posts yet. Create your first post above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <article
                className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}
                key={post.id}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-chestnut">{post.title}</h3>
                  <p className="text-olive">{post.summary || "No summary"}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-medium ${
                        post.status === "published"
                          ? "bg-olive/20 text-olive-dark"
                          : post.status === "draft"
                            ? "bg-desert-tan-dark/30 text-chestnut-dark"
                            : "bg-copper/15 text-copper"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="text-olive">/{post.slug}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-chestnut bg-transparent px-3 py-2 text-chestnut transition hover:bg-chestnut/5"
                    onClick={() => handleEdit(post)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-copper bg-transparent px-3 py-2 text-copper transition hover:bg-copper/10"
                    onClick={() => handleDelete(post.id)}
                  >
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
