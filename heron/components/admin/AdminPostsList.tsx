"use client";

import type { Post } from "@/lib/api";

type AdminPostsListProps = {
  posts: Post[];
  editingId: number | null;
  loadingEdit: boolean;
  cardClass: string;
  onEdit: (post: Post) => void;
  onDelete: (postId: number) => void;
};

function getPostDisplayStatus(post: Post) {
  if (post.status !== "published") return post.status;
  if (post.published_at && new Date(post.published_at) > new Date()) return "scheduled";
  return "published";
}

export default function AdminPostsList({
  posts,
  editingId,
  loadingEdit,
  cardClass,
  onEdit,
  onDelete
}: AdminPostsListProps) {
  return (
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
                    onClick={() => onEdit(post)}
                    disabled={loadingEdit}
                  >
                    {loadingEdit && editingId === post.id ? "Loading..." : "Edit"}
                  </button>
                  <button
                    className="rounded-lg border border-copper bg-transparent px-3 py-2 text-copper transition hover:bg-copper/10 dark:border-copper dark:text-copper-light dark:hover:bg-copper/20"
                    onClick={() => onDelete(post.id)}
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
  );
}
