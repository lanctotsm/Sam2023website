import type { FeedItem } from "./types";
import { MAX_FEED_ITEMS } from "./types";
import { sanitizePublicHttpUrl } from "./urlSafety";

function fromXmlCodePoint(code: number): string {
    if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return "";
    return String.fromCodePoint(code);
}

function decodeXmlEntities(text: string): string {
    return text
        .replace(/&#(\d+);/g, (_, code) => fromXmlCodePoint(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => fromXmlCodePoint(parseInt(hex, 16)))
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
}

function unwrapCdata(text: string): string {
    return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function xmlText(raw: string): string {
    return decodeXmlEntities(unwrapCdata(raw));
}

function stripHtml(html: string): string {
    const withBreaks = html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n");
    const text = withBreaks.replace(/<[^>]+>/g, " ");
    return decodeXmlEntities(text).replace(/\s+/g, " ").trim();
}

function firstTag(block: string, tag: string): string | null {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const match = block.match(re);
    if (!match) return null;
    return xmlText(match[1]);
}

function attrValue(block: string, tag: string, attr: string): string | null {
    const openRe = new RegExp(`<${tag}\\b[^>]*>`, "i");
    const open = block.match(openRe);
    if (!open) return null;
    const attrRe = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i");
    const m = open[0].match(attrRe);
    return m ? decodeXmlEntities(m[1].trim()) : null;
}

function linkHref(block: string): string | null {
    const relAlternate = block.match(/<link\b[^>]*rel\s*=\s*["']alternate["'][^>]*>/i);
    const candidate = relAlternate?.[0] ?? block.match(/<link\b[^>]*>/i)?.[0];
    if (!candidate) return null;
    const href = candidate.match(/href\s*=\s*["']([^"']+)["']/i);
    return href ? decodeXmlEntities(href[1].trim()) : null;
}

function extractImageUrl(block: string, description: string): string | null {
    const enclosure = block.match(/<enclosure\b[^>]*>/i)?.[0];
    if (enclosure) {
        const type = enclosure.match(/type\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
        const url = enclosure.match(/url\s*=\s*["']([^"']+)["']/i)?.[1];
        if (url && (type.startsWith("image/") || !type)) return decodeXmlEntities(url.trim());
    }

    for (const tag of ["media:content", "media:thumbnail", "media:group"]) {
        const url = attrValue(block, tag, "url");
        if (url) return url;
    }

    const imgMatch = description.match(/<img\b[^>]*src\s*=\s*["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1].trim() : null;
}

function parseRssItem(block: string): FeedItem | null {
    const titleRaw = firstTag(block, "title");
    const title = titleRaw ? stripHtml(titleRaw) : "";
    const link = firstTag(block, "link")?.trim() || linkHref(block) || "";
    if (!title && !link) return null;

    const pubDate = firstTag(block, "pubDate") || firstTag(block, "dc:date");
    const description =
        firstTag(block, "description") ||
        firstTag(block, "content:encoded") ||
        firstTag(block, "summary") ||
        "";

    return {
        title: title || "Untitled",
        url: sanitizePublicHttpUrl(link) ?? "",
        publishedAt: pubDate ? normalizeDate(pubDate) : null,
        excerpt: stripHtml(description).slice(0, 500),
        imageUrl: sanitizePublicHttpUrl(extractImageUrl(block, description)),
    };
}

function parseAtomEntry(block: string): FeedItem | null {
    const titleRaw = firstTag(block, "title");
    const title = titleRaw ? stripHtml(titleRaw) : "";
    const link = linkHref(block) || attrValue(block, "link", "href") || "";
    if (!title && !link) return null;

    const published =
        firstTag(block, "published") || firstTag(block, "updated") || firstTag(block, "created");
    const content =
        firstTag(block, "content") ||
        firstTag(block, "summary") ||
        "";

    return {
        title: title || "Untitled",
        url: sanitizePublicHttpUrl(link) ?? "",
        publishedAt: published ? normalizeDate(published) : null,
        excerpt: stripHtml(content).slice(0, 500),
        imageUrl: sanitizePublicHttpUrl(extractImageUrl(block, content)),
    };
}

function normalizeDate(raw: string): string | null {
    const d = new Date(raw.trim());
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

function splitBlocks(xml: string, tag: string): string[] {
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    return xml.match(re) ?? [];
}

export function parseFeedXml(xml: string): FeedItem[] {
    const trimmed = xml.trim();
    if (!trimmed) return [];

    const isAtom =
        /<feed\b/i.test(trimmed) &&
        (trimmed.includes("xmlns=\"http://www.w3.org/2005/Atom\"") || /<entry\b/i.test(trimmed));

    const blocks = isAtom ? splitBlocks(trimmed, "entry") : splitBlocks(trimmed, "item");
    const parseBlock = isAtom ? parseAtomEntry : parseRssItem;

    const items: FeedItem[] = [];
    for (const block of blocks) {
        const item = parseBlock(block);
        if (item && (item.url || item.title)) {
            items.push(item);
        }
        if (items.length >= MAX_FEED_ITEMS) break;
    }

    return items;
}
