"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Post } from "@/lib/api";
import { apiFetch, createPost, uploadImages } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { buildImageUrl } from "@/lib/images";
import AlbumSelectModal from "@/components/AlbumSelectModal";
import MarkdownPreview from "@/components/MarkdownPreview";

const emptyPost = {
  title: "",
  slug: "",
  summary: "",
  markdown: "",
  status: "draft",
  published_at: "",
  metadata: {} as Record<string, string>
};

function toDateTimeLocal(isoString?: string | null) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  // Adjust for local timezone offset to show correct local time in input
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(localString?: string) {
  if (!localString) return null;
  const d = new Date(localString);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminPostsPage() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState(emptyPost);
  const [ownedImageIds, setOwnedImageIds] = useState<number[] | null>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [error, setError] = useState("");
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const inlineUploadInputRef = useRef<HTMLInputElement>(null);

  const [newMetaKey, setNewMetaKey] = useState("");
  const [newMetaValue, setNewMetaValue] = useState("");

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

  const appliedEditRef = useRef<string | null>(null);
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && posts.length > 0 && appliedEditRef.current !== editId) {
      appliedEditRef.current = editId;
      const id = parseInt(editId, 10);
      const post = posts.find((p) => p.id === id);
      if (post) {
        handleEdit(post);
      }
    }
  }, [searchParams, posts]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        published_at: fromDateTimeLocal(form.published_at),
        inline_image_ids: ownedImageIds || []
      };

      if (editingId) {
        const updated = await apiFetch<Post>(`/posts/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setPosts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        setEditingId(null);
      } else {
        const created = await createPost(payload);
        setPosts((prev) => [created, ...prev]);
      }
      setForm(emptyPost);
      setOwnedImageIds([]);
      toast.success(editingId ? "Post updated." : "Post created.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save post";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (post: Post) => {
    setLoadingEdit(true);
    try {
      const fullPost = await apiFetch<Post>(`/posts/${post.id}`);
      setEditingId(fullPost.id);
      setForm({
        title: fullPost.title,
        slug: fullPost.slug,
        summary: fullPost.summary || "",
        markdown: fullPost.markdown,
        status: fullPost.status,
        published_at: toDateTimeLocal(fullPost.published_at),
        metadata: fullPost.metadata || {}
      });
      setOwnedImageIds(fullPost.inline_image_ids || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load post";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingEdit(false);
    }
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
      cancel: { label: "Cancel", onClick: () => { } }
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyPost);
    setOwnedImageIds([]);
    setError("");
    setNewMetaKey("");
    setNewMetaValue("");
  };

  const addMetadata = () => {
    const k = newMetaKey.trim();
    const v = newMetaValue.trim();
    if (!k || !v) return;
    setForm((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [k]: v }
    }));
    setNewMetaKey("");
    setNewMetaValue("");
  };

  const removeMetadata = (key: string) => {
    setForm((prev) => {
      const nextMeta = { ...prev.metadata };
      delete nextMeta[key];
      return { ...prev, metadata: nextMeta };
    });
  };

  const insertMarkdownAtCursor = (snippet: string) => {
    const textarea = markdownRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, markdown: `${prev.markdown}\n\n${snippet}`.trim() }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const existing = form.markdown;
    const before = existing.slice(0, start);
    const after = existing.slice(end);
    const nextValue = `${before}${snippet}${after}`;
    const nextCursorPos = before.length + snippet.length;
    setForm((prev) => ({ ...prev, markdown: nextValue }));

    requestAnimationFrame(() => {
      if (!markdownRef.current) return;
      markdownRef.current.focus();
      markdownRef.current.selectionStart = nextCursorPos;
      markdownRef.current.selectionEnd = nextCursorPos;
    });
  };

  const handleAlbumSelect = (slug: string) => {
    insertMarkdownAtCursor(`[[album:${slug}]]`);
    setIsAlbumModalOpen(false);
  };

  const handleUploadAndInsert = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploadingInline(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      const uploaded = await uploadImages(formData);
      const markdownSnippets = uploaded.images.map((image) => {
        const alt = image.alt_text || image.caption || image.name || "Image";
        const url = buildImageUrl(image.s3_key);
        return `![${alt}](${url})`;
      });
      const combined = markdownSnippets.join("\n\n");
      insertMarkdownAtCursor(combined);
      setOwnedImageIds((prev) => {
        const base = prev || [];
        const incoming = uploaded.images.map((img) => img.id);
        return Array.from(new Set([...base, ...incoming]));
      });
      toast.success(`Inserted ${uploaded.images.length} image markdown link(s).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploadingInline(false);
    }
  };

  const getPostDisplayStatus = (post: Post) => {
    if (post.status !== "published") return post.status;
    if (post.published_at && new Date(post.published_at) > new Date()) return "scheduled";
    return "published";
  };

  const inputClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition focus:border-chestnut focus:ring-2 focus:ring-chestnut/10 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted/60";
  const labelClass = "text-sm font-medium text-chestnut-dark dark:text-dark-text";
  const cardClass =
    "rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";

  return (
    <div className="flex flex-col gap-6">
      <section className={`${cardClass} flex flex-col gap-4`}>
        <h2 className="m-0 text-chestnut dark:text-dark-text">{editingId ? "Edit Post" : "Create Post"}</h2>
        <label className={labelClass}>Title</label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((prev) => ({
              ...prev,
              title,
              slug: editingId ? prev.slug : slugify(title)
            }));
          }}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className={labelClass}>Content (Markdown)</label>
          <button
            type="button"
            onClick={() => inlineUploadInputRef.current?.click()}
            className="rounded-lg border border-chestnut bg-transparent px-3 py-1.5 text-sm text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
            disabled={uploadingInline || loading}
          >
            {uploadingInline ? "Uploading..." : "Upload & Insert Image"}
          </button>
          <button
            type="button"
            onClick={() => setIsAlbumModalOpen(true)}
            className="rounded-lg border border-chestnut bg-transparent px-3 py-1.5 text-sm text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
            disabled={loading}
          >
            Insert Album
          </button>
          <input
            ref={inlineUploadInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUploadAndInsert}
            disabled={uploadingInline || loading}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <textarea
            ref={markdownRef}
            className={inputClass}
            rows={12}
            value={form.markdown}
            onChange={(e) => setForm({ ...form, markdown: e.target.value })}
            placeholder="Write your post content in markdown..."
          />
          <div className="rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 dark:border-dark-muted dark:bg-dark-bg">
            <p className="mb-2 text-xs font-medium text-olive dark:text-dark-muted">Preview</p>
            <div className="max-h-[280px] overflow-y-auto">
              {form.markdown ? (
                <MarkdownPreview markdown={form.markdown} />
              ) : (
                <p className="text-olive dark:text-dark-muted">Preview will appear here...</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <div>
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
          </div>
          <div>
            <label className={labelClass}>Publish Date (Local Time)</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.published_at}
              onChange={(e) => setForm({ ...form, published_at: e.target.value })}
            />
            <p className="mt-1 text-xs text-olive dark:text-dark-muted">
              Set a future date with &apos;Published&apos; status to schedule.
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-desert-tan-dark pt-4 dark:border-dark-muted">
          <h3 className="text-sm font-semibold text-chestnut-dark dark:text-dark-text mb-3">Custom Fields (Metadata)</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(form.metadata).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <input className={`${inputClass} !py-1.5`} value={key} disabled />
                <input className={`${inputClass} !py-1.5`} value={val} disabled />
                <button
                  type="button"
                  onClick={() => removeMetadata(key)}
                  className="rounded px-2 text-copper hover:bg-copper/10"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <input
                className={`${inputClass} !py-1.5`}
                placeholder="Key (e.g., seo_title)"
                value={newMetaKey}
                onChange={(e) => setNewMetaKey(e.target.value)}
              />
              <input
                className={`${inputClass} !py-1.5`}
                placeholder="Value"
                value={newMetaValue}
                onChange={(e) => setNewMetaValue(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-olive px-3 py-1.5 text-sm text-white transition hover:bg-olive-dark"
                onClick={addMetadata}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-copper text-sm dark:text-copper-light">{error}</p>}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            className="rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark disabled:opacity-60 dark:text-dark-text"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Saving..." : editingId ? "Update Post" : "Create Post"}
          </button>
          {editingId && (
            <button
              className="rounded-lg border border-chestnut bg-transparent px-4 py-2.5 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-chestnut dark:text-dark-text">All Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className={`${cardClass} text-olive dark:text-dark-muted`}>No posts yet. Create your first post above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => {
              const displayStatus = getPostDisplayStatus(post);
              return (
                <article
                  className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}
                  key={post.id}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-chestnut dark:text-dark-text">{post.title}</h3>
                    <p className="text-olive dark:text-dark-muted">{post.summary || "No summary"}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-medium uppercase text-xs tracking-wider ${displayStatus === "published"
                          ? "bg-olive/20 text-olive-dark dark:bg-olive/30 dark:text-olive-light"
                          : displayStatus === "scheduled"
                            ? "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"
                            : displayStatus === "draft"
                              ? "bg-desert-tan-dark/50 text-chestnut-dark dark:bg-dark-muted/50 dark:text-dark-muted"
                              : "bg-copper/15 text-copper dark:bg-copper/25 dark:text-copper-light"
                          }`}
                      >
                        {displayStatus}
                      </span>
                      <span className="text-olive dark:text-dark-muted">/{post.slug}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-chestnut bg-transparent px-3 py-2 text-chestnut transition hover:bg-chestnut/5 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
                      onClick={() => handleEdit(post)}
                      disabled={loadingEdit}
                    >
                      {loadingEdit && editingId === post.id ? "Loading..." : "Edit"}
                    </button>
                    <button
                      className="rounded-lg border border-copper bg-transparent px-3 py-2 text-copper transition hover:bg-copper/10 dark:border-copper dark:text-copper-light dark:hover:bg-copper/20"
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <AlbumSelectModal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        onSelect={handleAlbumSelect}
      />
    </div>
  );
}
