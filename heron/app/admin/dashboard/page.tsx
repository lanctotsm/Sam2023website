import Link from "next/link";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import { getAuthUser } from "@/lib/api-utils";
import { getContentCounts } from "@/services/content-stats";
import { getAllPosts } from "@/services/posts";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function AdminDashboardPage() {
  const user = await getAuthUser();
  const counts = getContentCounts();
  const recentPosts = user ? (await getAllPosts({ user })).slice(0, 5) : [];

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-olive-dark dark:text-dark-muted">Posts</h3>
          <p className="mb-3 text-4xl font-bold text-chestnut dark:text-dark-text">{counts.posts}</p>
          <Link href="/admin/posts" className="font-medium text-copper hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan">
            Manage posts →
          </Link>
        </div>
        <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-olive-dark dark:text-dark-muted">Albums</h3>
          <p className="mb-3 text-4xl font-bold text-chestnut dark:text-dark-text">{counts.albums}</p>
          <Link href="/admin/albums" className="font-medium text-copper hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan">
            Manage albums →
          </Link>
        </div>
        <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-olive-dark dark:text-dark-muted">Images</h3>
          <p className="mb-3 text-4xl font-bold text-chestnut dark:text-dark-text">{counts.images}</p>
          <Link href="/admin/media" className="font-medium text-copper hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan">
            View media →
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
        <h2 className="text-chestnut dark:text-dark-text">Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <p className="mt-2 text-olive dark:text-dark-muted">No posts yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-lg text-chestnut dark:text-dark-text">{post.title}</h4>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/posts?edit=${post.id}`}
                      className="text-sm font-medium text-copper hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan"
                    >
                      Edit
                    </Link>
                    {post.status === "published" && (
                      <Link
                        href={`/posts/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-copper hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                      post.status === "published"
                        ? "bg-[#3a7a3a] text-white"
                        : post.status === "draft"
                          ? "bg-olive text-white"
                          : "bg-desert-tan-dark text-chestnut dark:bg-dark-muted dark:text-dark-text"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/posts" className="mt-4 inline-block font-medium text-copper hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan">
          View all posts →
        </Link>
      </section>

      <AdminQuickActions
        actions={[
          { href: "/admin/posts", emoji: "📝", label: "Create Post" },
          { href: "/upload", emoji: "📷", label: "Upload Photos" },
          { href: "/admin/albums", emoji: "📁", label: "Manage Albums" }
        ]}
      />
    </div>
  );
}
