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

    it("unwraps CDATA titles and decodes escaped URLs", () => {
        const xml = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title><![CDATA[Tom &amp; Jerry]]></title>
    <link>https://example.com/watch?x=1&amp;y=2</link>
    <enclosure url="https://img.example/a.jpg?w=1&amp;h=2" type="image/jpeg"/>
    <description><![CDATA[<p>A cartoon.</p>]]></description>
  </item>
</channel></rss>`;
        const items = parseFeedXml(xml);
        expect(items[0].title).toBe("Tom & Jerry");
        expect(items[0].url).toBe("https://example.com/watch?x=1&y=2");
        expect(items[0].imageUrl).toBe("https://img.example/a.jpg?w=1&h=2");
        expect(items[0].excerpt).toBe("A cartoon.");
        expect(items[0].excerpt).not.toContain("]]>");
    });

    it("reads images out of escaped Atom HTML", () => {
        const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Escaped</title>
    <link href="https://example.com/atom?a=1&amp;b=2" rel="alternate"/>
    <summary type="html">&lt;p&gt;&lt;img src="https://img.example/p.jpg?w=1&amp;h=2"/&gt; Caption&lt;/p&gt;</summary>
  </entry>
</feed>`;
        const items = parseFeedXml(xml);
        expect(items[0].title).toBe("Escaped");
        expect(items[0].url).toBe("https://example.com/atom?a=1&b=2");
        expect(items[0].excerpt).toContain("Caption");
        expect(items[0].excerpt).not.toContain("<p>");
        expect(items[0].imageUrl).toBe("https://img.example/p.jpg?w=1&h=2");
    });

    it("drops javascript item links and images", () => {
        const xml = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title>Evil</title>
    <link>javascript:alert(1)</link>
    <description><![CDATA[<img src="javascript:alert(2)"/>]]></description>
  </item>
</channel></rss>`;
        const items = parseFeedXml(xml);
        expect(items).toHaveLength(1);
        expect(items[0].url).toBe("");
        expect(items[0].imageUrl).toBeNull();
    });
});
