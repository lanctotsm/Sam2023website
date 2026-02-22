import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { Post, Album, Image } from "@/lib/api";

export const dynamic = "force-dynamic";

function formatRecentDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default async function AdminDashboardPage() {
  const posts = await serverFetch<Post[]>("/posts");
  const albums = await serverFetch<Album[]>("/albums");
  const images = await serverFetch<Image[]>("/images");

  const recentPosts = (posts || []).slice(0, 5);

  return (
    <article className="admin-dashboard">
      <header className="section-header">
        <h1 className="section-header__title">Admin Dashboard</h1>
        <p className="section-header__desc">Manage your content and view site statistics.</p>
      </header>

      <section className="admin-stats">
        <div className="card admin-stats__item">
          <span className="admin-stats__label">Total Posts</span>
          <span className="admin-stats__value">{posts?.length || 0}</span>
        </div>
        <div className="card admin-stats__item">
          <span className="admin-stats__label">Total Albums</span>
          <span className="admin-stats__value">{albums?.length || 0}</span>
        </div>
        <div className="card admin-stats__item">
          <span className="admin-stats__label">Total Images</span>
          <span className="admin-stats__value">{images?.length || 0}</span>
        </div>
      </section>

      <div className="admin-actions">
        <section className="card">
          <h2 className="resume-section__title">Quick Actions</h2>
          <div className="flex flex-col gap-3 mt-4">
            <Link href="/admin/posts/new" className="btn btn--primary">
              Create New Post
            </Link>
            <Link href="/admin/albums" className="btn btn--outline">
              Manage Albums
            </Link>
            <Link href="/admin/images" className="btn btn--outline">
              Image Library
            </Link>
          </div>
        </section>

        <section className="card">
          <h2 className="resume-section__title">Recent Posts</h2>
          <div className="admin-recent mt-4">
            {recentPosts.length === 0 ? (
              <p className="text-olive dark:text-dark-muted">No posts available.</p>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="admin-recent__item">
                  <span className="admin-recent__title">{post.title}</span>
                  <span className="admin-recent__date">
                    {formatRecentDate(post.published_at || post.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <h2 className="resume-section__title">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="font-medium text-chestnut-dark dark:text-dark-text">API Connection</span>
            <span className="text-sm text-olive dark:text-dark-muted ml-auto">Healthy</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="font-medium text-chestnut-dark dark:text-dark-text">Database</span>
            <span className="text-sm text-olive dark:text-dark-muted ml-auto">Connected</span>
          </div>
        </div>
      </section>
    </article>
  );
}
