import type { MetadataRoute } from "next";
import { getAllPosts } from "@/services/posts";
import { getAllAlbums } from "@/services/albums";

const baseUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = baseUrl.replace(/\/+$/, "");

  const [postRows, albumRows] = await Promise.all([
    getAllPosts({}),
    getAllAlbums()
  ]);

  const posts = Array.isArray(postRows) ? postRows : [];
  const albums = Array.isArray(albumRows) ? albumRows : [];

  const staticPages: MetadataRoute.Sitemap = [
    { url: root, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${root}/resume`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${root}/posts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${root}/albums`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 }
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${root}/posts/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  const albumPages: MetadataRoute.Sitemap = albums.map((a) => ({
    url: `${root}/albums/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  return [...staticPages, ...postPages, ...albumPages];
}
