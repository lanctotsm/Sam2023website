import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";
import { getAllAlbums } from "@/services/albums";
import { getAllPosts } from "@/services/posts";

const flags = vi.hoisted(() => ({ indexAlbumPages: false }));

vi.mock("next/server", () => ({
  connection: vi.fn(async () => undefined)
}));

vi.mock("@/services/posts", () => ({
  getAllPosts: vi.fn()
}));

vi.mock("@/services/albums", () => ({
  getAllAlbums: vi.fn()
}));

vi.mock("@/lib/search-indexing", () => ({
  get INDEX_ALBUM_PAGES() {
    return flags.indexAlbumPages;
  }
}));

type PostRows = Awaited<ReturnType<typeof getAllPosts>>;
type AlbumRows = Awaited<ReturnType<typeof getAllAlbums>>;

async function sitemapUrls() {
  return (await sitemap()).map((entry) => entry.url);
}

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flags.indexAlbumPages = false;
    vi.stubEnv("NEXTAUTH_URL", "https://example.test/");
    vi.mocked(getAllPosts).mockResolvedValue([
      { slug: "hello-world", updatedAt: "2026-01-02T00:00:00.000Z" }
    ] as unknown as PostRows);
    vi.mocked(getAllAlbums).mockResolvedValue([
      { slug: "family-trip", updatedAt: "2026-01-03T00:00:00.000Z" }
    ] as unknown as AlbumRows);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists the static pages and posts", async () => {
    const urls = await sitemapUrls();
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://example.test",
        "https://example.test/resume",
        "https://example.test/posts",
        "https://example.test/albums",
        "https://example.test/posts/hello-world"
      ])
    );
  });

  it("omits album detail pages and skips the albums query", async () => {
    const urls = await sitemapUrls();
    expect(urls.filter((url) => url.startsWith("https://example.test/albums/"))).toEqual([]);
    expect(getAllAlbums).not.toHaveBeenCalled();
  });

  it("includes album detail pages when INDEX_ALBUM_PAGES is on", async () => {
    flags.indexAlbumPages = true;
    const urls = await sitemapUrls();
    expect(urls).toContain("https://example.test/albums/family-trip");
    expect(getAllAlbums).toHaveBeenCalledTimes(1);
  });
});
