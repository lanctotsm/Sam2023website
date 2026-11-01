import { parseFeedXml } from "./parseFeedXml";
import type { FeedItem, RssFeedSource } from "./types";
import { FEED_FETCH_TIMEOUT_MS, FEED_MAX_BYTES, MAX_FEED_ITEMS } from "./types";
import { isAllowedFeedUrl } from "./urlSafety";

export { isAllowedFeedUrl, sanitizePublicHttpUrl } from "./urlSafety";

export type FeedFetchResult =
    | { status: "ok"; items: FeedItem[] }
    | { status: "error"; message: string };

const MAX_REDIRECTS = 3;

async function fetchWithSafeRedirects(
    startUrl: string,
    signal: AbortSignal,
    allowHttp: boolean
): Promise<Response> {
    let currentUrl = startUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        if (!isAllowedFeedUrl(currentUrl, allowHttp)) {
            throw new Error("Feed URL not allowed");
        }

        const response = await fetch(currentUrl, {
            signal,
            redirect: "manual",
            headers: {
                Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
                "User-Agent": "HeronCMS/1.0 (RSS reader)",
            },
            next: { revalidate: 3600 },
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) {
                throw new Error(`Feed redirect missing Location (${response.status})`);
            }
            currentUrl = new URL(location, currentUrl).href;
            continue;
        }

        return response;
    }

    throw new Error("Too many feed redirects");
}

export async function fetchFeedItems(
    source: RssFeedSource,
    options?: { allowHttp?: boolean }
): Promise<FeedFetchResult> {
    const feedUrl = source.feedUrl.trim();
    const allowHttp = options?.allowHttp ?? false;
    if (!feedUrl || !isAllowedFeedUrl(feedUrl, allowHttp)) {
        return { status: "error", message: "Invalid feed URL" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FEED_FETCH_TIMEOUT_MS);

    try {
        const response = await fetchWithSafeRedirects(feedUrl, controller.signal, allowHttp);

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
