import { describe, expect, it } from "vitest";
import { parseFeedXml } from "./parseFeedXml";

const BLOG_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <item>
      <title>Hello World</title>
      <link>https://example.com/hello</link>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      <description><![CDATA[<p>First post body.</p>]]></description>
    </item>
  </channel>
</rss>`;

const ATOM_FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Site</title>
  <entry>
    <title>Atom Entry</title>
    <link href="https://example.com/atom/1" rel="alternate"/>
    <published>2024-06-15T10:00:00Z</published>
    <summary type="html">&lt;p&gt;Summary text&lt;/p&gt;</summary>
  </entry>
</feed>`;

const LETTERBOXD_SHAPED = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Letterboxd - samlanctot</title>
    <item>
      <title>The Brutalist (2024) ★★★★</title>
      <link>https://letterboxd.com/samlanctot/film/the-brutalist/</link>
      <pubDate>Sun, 12 Jun 2026 18:00:00 +0000</pubDate>
      <description><![CDATA[<p><img src="https://a.ltrbxd.com/resized/poster.jpg"/></p><p>Stunning epic.</p>]]></description>
    </item>
  </channel>
</rss>`;

describe("parseFeedXml", () => {
    it("parses RSS 2.0 blog feed", () => {
        const items = parseFeedXml(BLOG_RSS);
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe("Hello World");
        expect(items[0].url).toBe("https://example.com/hello");
        expect(items[0].excerpt).toContain("First post body");
        expect(items[0].publishedAt).not.toBeNull();
    });

    it("parses Atom feed", () => {
        const items = parseFeedXml(ATOM_FEED);
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe("Atom Entry");
        expect(items[0].url).toBe("https://example.com/atom/1");
        expect(items[0].excerpt).toContain("Summary text");
    });

    it("extracts poster from Letterboxd-shaped description", () => {
        const items = parseFeedXml(LETTERBOXD_SHAPED);
        expect(items[0].title).toContain("The Brutalist");
        expect(items[0].title).toContain("★");
        expect(items[0].imageUrl).toBe("https://a.ltrbxd.com/resized/poster.jpg");
        expect(items[0].url).toContain("letterboxd.com");
    });

    it("returns empty array for invalid XML", () => {
        expect(parseFeedXml("not xml")).toEqual([]);
        expect(parseFeedXml("")).toEqual([]);
    });

    it("preserves item title and does not use channel title", () => {
        const items = parseFeedXml(BLOG_RSS);
        expect(items[0].title).not.toBe("My Blog");
    });
});
