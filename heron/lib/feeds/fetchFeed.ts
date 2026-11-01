import { lookup } from "node:dns/promises";
import { parseFeedXml } from "./parseFeedXml";
import type { FeedItem, RssFeedSource } from "./types";
import { FEED_FETCH_TIMEOUT_MS, FEED_MAX_BYTES, MAX_FEED_ITEMS } from "./types";
import { hostResolvesToPublicAddresses, isAllowedFeedUrl, type AddressLookup } from "./urlSafety";

export { isAllowedFeedUrl, sanitizePublicHttpUrl } from "./urlSafety";

export type FeedFetchResult =
    | { status: "ok"; items: FeedItem[] }
    | { status: "error"; message: string };

const MAX_REDIRECTS = 3;

const defaultLookup: AddressLookup = async (hostname) => {
    const results = await lookup(hostname, { all: true, verbatim: true });
    return results.map((result) => result.address);
};

export async function readCappedBody(response: Response, maxBytes: number): Promise<Uint8Array | null> {
    const declared = response.headers.get("content-length");
    if (declared !== null) {
        const size = Number(declared);
        if (!Number.isFinite(size) || size < 0 || size > maxBytes) {
            await response.body?.cancel();
            return null;
        }
    }

    if (!response.body) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > maxBytes) return null;
        return new Uint8Array(buffer);
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value || value.byteLength === 0) continue;
        total += value.byteLength;
        if (total > maxBytes) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }
    reader.releaseLock();

    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return body;
}

async function fetchWithSafeRedirects(
    startUrl: string,
    signal: AbortSignal,
    allowHttp: boolean,
    resolve: AddressLookup
): Promise<Response> {
    let currentUrl = startUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        if (!(await hostResolvesToPublicAddresses(currentUrl, resolve, allowHttp))) {
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
            await response.body?.cancel();
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
    options?: { allowHttp?: boolean; lookup?: AddressLookup }
): Promise<FeedFetchResult> {
    const feedUrl = source.feedUrl.trim();
    const allowHttp = options?.allowHttp ?? false;
    const resolve = options?.lookup ?? defaultLookup;
    if (!feedUrl || !isAllowedFeedUrl(feedUrl, allowHttp)) {
        return { status: "error", message: "Invalid feed URL" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FEED_FETCH_TIMEOUT_MS);

    try {
        const response = await fetchWithSafeRedirects(feedUrl, controller.signal, allowHttp, resolve);

        if (!response.ok) {
            await response.body?.cancel();
            return { status: "error", message: `Feed returned ${response.status}` };
        }

        const body = await readCappedBody(response, FEED_MAX_BYTES);
        if (!body) {
            return { status: "error", message: "Feed response too large" };
        }

        const xml = new TextDecoder("utf-8", { fatal: false }).decode(body);
        const items = parseFeedXml(xml).slice(0, MAX_FEED_ITEMS);
        return { status: "ok", items };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch feed";
        return { status: "error", message };
    } finally {
        clearTimeout(timeout);
    }
}
