import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import robots from "./robots";

const flags = vi.hoisted(() => ({ indexAlbumPages: false }));

vi.mock("@/lib/search-indexing", () => ({
  get INDEX_ALBUM_PAGES() {
    return flags.indexAlbumPages;
  }
}));

function firstRule() {
  const { rules } = robots();
  return Array.isArray(rules) ? rules[0] : rules;
}

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

describe("robots", () => {
  beforeEach(() => {
    flags.indexAlbumPages = false;
    vi.stubEnv("NEXTAUTH_URL", "https://example.test/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the site and blocks private routes", () => {
    const rule = firstRule();
    expect(rule.userAgent).toBe("*");
    expect(asList(rule.allow)).toContain("/");
    expect(asList(rule.disallow)).toEqual(
      expect.arrayContaining(["/admin", "/api", "/upload"])
    );
  });

  it("blocks album detail pages but not the /albums index", () => {
    const disallow = asList(firstRule().disallow);
    expect(disallow).toContain("/albums/");
    expect(disallow).not.toContain("/albums");
  });

  it("points crawlers at the sitemap on the configured site URL", () => {
    expect(robots().sitemap).toBe("https://example.test/sitemap.xml");
  });

  it("lifts the album rule when INDEX_ALBUM_PAGES is on", () => {
    flags.indexAlbumPages = true;
    const disallow = asList(firstRule().disallow);
    expect(disallow).not.toContain("/albums/");
    expect(disallow).toEqual(
      expect.arrayContaining(["/admin", "/api", "/upload"])
    );
  });
});
