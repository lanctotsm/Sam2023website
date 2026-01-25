"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Post, Album, Image } from "@/lib/api";
import { apiFetch } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ posts: 0, albums: 0, images: 0 });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [posts, albums, images] = await Promise.all([
          apiFetch<Post[]>("/posts").then((d) => d || []),
          apiFetch<Album[]>("/albums").then((d) => d || []),
          apiFetch<Image[]>("/images").then((d) => d || [])
        ]);
        setStats({
          posts: posts.length,
          albums: albums.length,
          images: images.length
        });
        setRecentPosts(posts.slice(0, 5));
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <p className="muted">Loading dashboard...</p>;
  }

  return (
    <div className="stack">
      <div className="stats-grid">
        <div className="card stat-card">
          <h3>Posts</h3>
          <p className="stat-number">{stats.posts}</p>
          <Link href="/admin/posts" className="text-link">
            Manage posts →
          </Link>
        </div>
        <div className="card stat-card">
          <h3>Albums</h3>
          <p className="stat-number">{stats.albums}</p>
          <Link href="/admin/albums" className="text-link">
            Manage albums →
          </Link>
        </div>
        <div className="card stat-card">
          <h3>Images</h3>
          <p className="stat-number">{stats.images}</p>
          <Link href="/admin/media" className="text-link">
            View media →
          </Link>
        </div>
      </div>

      <section className="card stack">
        <h2>Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <p className="muted">No posts yet.</p>
        ) : (
          <div className="admin-list">
            {recentPosts.map((post) => (
              <div className="admin-list-item" key={post.id}>
                <div className="admin-list-content">
                  <h4>{post.title}</h4>
                  <span className={`status-badge status-${post.status}`}>{post.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/posts" className="text-link">
          View all posts →
        </Link>
      </section>

      <section className="card stack">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link href="/admin/posts" className="action-card">
            <span className="action-icon">📝</span>
            <span>Create Post</span>
          </Link>
          <Link href="/upload" className="action-card">
            <span className="action-icon">📷</span>
            <span>Upload Photos</span>
          </Link>
          <Link href="/admin/albums" className="action-card">
            <span className="action-icon">📁</span>
            <span>Manage Albums</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
