export type FeedItem = {
    title: string;
    url: string;
    publishedAt: string | null;
    excerpt: string;
    imageUrl: string | null;
};

export type RssFeedSource = {
    title: string;
    feedUrl: string;
};

export const MAX_FEED_ITEMS = 30;

export const FEED_FETCH_TIMEOUT_MS = 15_000;

export const FEED_MAX_BYTES = 2_000_000;
