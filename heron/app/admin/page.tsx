"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Post, Album, Image } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import { PostCardSkeleton, StatCardSkeleton } from "@/components/Skeleton";

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
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
          <div className="h-6 w-32 animate-pulse rounded bg-desert-tan-dark/40 dark:bg-dark-muted/40" />
          <div className="mt-4 grid gap-3">
            {[1, 2, 3].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-olive-dark">Posts</h3>
          <p className="mb-3 text-4xl font-bold text-chestnut">{stats.posts}</p>
          <Link href="/admin/posts" className="font-medium text-copper hover:text-chestnut">
            Manage posts →
          </Link>
        </div>
        <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-olive-dark">Albums</h3>
          <p className="mb-3 text-4xl font-bold text-chestnut">{stats.albums}</p>
          <Link href="/admin/albums" className="font-medium text-copper hover:text-chestnut">
            Manage albums →
          </Link>
        </div>
        <div className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-olive-dark">Images</h3>
          <p className="mb-3 text-4xl font-bold text-chestnut">{stats.images}</p>
          <Link href="/admin/media" className="font-medium text-copper hover:text-chestnut">
            View media →
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
        <h2 className="text-chestnut">Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <p className="mt-2 text-olive">No posts yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-lg text-chestnut">{post.title}</h4>
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                      post.status === "published"
                        ? "bg-[#3a7a3a] text-white"
                        : post.status === "draft"
                          ? "bg-olive text-white"
                          : "bg-desert-tan-dark text-chestnut"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/posts" className="mt-4 inline-block font-medium text-copper hover:text-chestnut">
          View all posts →
        </Link>
      </section>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
        <h2 className="text-chestnut">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Link
            href="/admin/posts"
            className="flex flex-col items-center gap-2 rounded-xl border border-desert-tan-dark bg-white p-5 text-chestnut transition-all hover:-translate-y-0.5 hover:border-caramel hover:bg-desert-tan"
          >
            <span className="text-3xl">📝</span>
            <span>Create Post</span>
          </Link>
          <Link
            href="/upload"
            className="flex flex-col items-center gap-2 rounded-xl border border-desert-tan-dark bg-white p-5 text-chestnut transition-all hover:-translate-y-0.5 hover:border-caramel hover:bg-desert-tan"
          >
            <span className="text-3xl">📷</span>
            <span>Upload Photos</span>
          </Link>
          <Link
            href="/admin/albums"
            className="flex flex-col items-center gap-2 rounded-xl border border-desert-tan-dark bg-white p-5 text-chestnut transition-all hover:-translate-y-0.5 hover:border-caramel hover:bg-desert-tan"
          >
            <span className="text-3xl">📁</span>
            <span>Manage Albums</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
