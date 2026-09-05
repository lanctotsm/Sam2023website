import { parseFeedXml } from "./parseFeedXml";
import type { FeedItem, RssFeedSource } from "./types";
import { FEED_FETCH_TIMEOUT_MS, FEED_MAX_BYTES, MAX_FEED_ITEMS } from "./types";

export type FeedFetchResult =
    | { status: "ok"; items: FeedItem[] }
    | { status: "error"; message: string };

export function isAllowedFeedUrl(url: string, allowHttp = false): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") return true;
        if (allowHttp && parsed.protocol === "http:") return true;
        return false;
    } catch {
        return false;
    }
}

export async function fetchFeedItems(
    source: RssFeedSource,
    options?: { allowHttp?: boolean }
): Promise<FeedFetchResult> {
    const feedUrl = source.feedUrl.trim();
    if (!feedUrl || !isAllowedFeedUrl(feedUrl, options?.allowHttp)) {
        return { status: "error", message: "Invalid feed URL" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FEED_FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(feedUrl, {
            signal: controller.signal,
            headers: {
                Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
                "User-Agent": "HeronCMS/1.0 (RSS reader)",
            },
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            return { status: "error", message: `Feed returned ${response.status}` };
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > FEED_MAX_BYTES) {
            return { status: "error", message: "Feed response too large" };
        }

        const xml = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        const items = parseFeedXml(xml).slice(0, MAX_FEED_ITEMS);
        return { status: "ok", items };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch feed";
        return { status: "error", message };
    } finally {
        clearTimeout(timeout);
    }
}
