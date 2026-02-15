import { NextResponse } from "next/server";
import { getAllPosts } from "@/services/posts";
import { serializePost } from "@/lib/serializers";

const baseUrl =
  process.env.NEXTAUTH_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000") ||
  "http://localhost:3000";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatRfc822(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toUTCString();
}

export async function GET() {
  const rows = await getAllPosts({});
  const posts = Array.isArray(rows) ? rows.map(serializePost) : [];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Heron</title>
    <link>${escapeXml(baseUrl.replace(/\/+$/, ""))}</link>
    <description>RSS feed for published posts</description>
    <language>en-us</language>
    <lastBuildDate>${formatRfc822(new Date().toISOString())}</lastBuildDate>
    <atom:link href="${escapeXml(baseUrl.replace(/\/+$/, ""))}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(baseUrl.replace(/\/+$/, ""))}/posts/${escapeXml(p.slug)}</link>
      <description>${escapeXml(p.summary || "")}</description>
      <pubDate>${formatRfc822(p.updated_at)}</pubDate>
      <guid isPermaLink="true">${escapeXml(baseUrl.replace(/\/+$/, ""))}/posts/${escapeXml(p.slug)}</guid>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
