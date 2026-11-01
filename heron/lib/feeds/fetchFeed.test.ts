import { afterEach, describe, expect, it, vi } from "vitest";
import { FEED_MAX_BYTES } from "./types";
import { fetchFeedItems, isAllowedFeedUrl, readCappedBody, sanitizePublicHttpUrl } from "./fetchFeed";
import { isBlockedResolvedAddress } from "./urlSafety";

describe("isAllowedFeedUrl", () => {
    it("allows https URLs", () => {
        expect(isAllowedFeedUrl("https://letterboxd.com/user/rss/")).toBe(true);
    });

    it("rejects http unless explicitly allowed", () => {
        expect(isAllowedFeedUrl("http://insecure.example/rss")).toBe(false);
        expect(isAllowedFeedUrl("http://insecure.example/rss", true)).toBe(true);
    });

    it("rejects invalid URLs", () => {
        expect(isAllowedFeedUrl("not-a-url")).toBe(false);
    });

    it("rejects private and link-local hosts", () => {
        expect(isAllowedFeedUrl("https://127.0.0.1/rss")).toBe(false);
        expect(isAllowedFeedUrl("https://localhost/rss")).toBe(false);
        expect(isAllowedFeedUrl("https://10.0.0.5/rss")).toBe(false);
        expect(isAllowedFeedUrl("https://192.168.1.1/rss")).toBe(false);
        expect(isAllowedFeedUrl("https://169.254.169.254/latest/meta-data/")).toBe(false);
        expect(isAllowedFeedUrl("https://172.16.0.1/rss")).toBe(false);
        expect(isAllowedFeedUrl("https://[::1]/rss")).toBe(false);
        expect(isAllowedFeedUrl("https://metadata.google.internal/")).toBe(false);
    });

    it("rejects URLs with embedded credentials", () => {
        expect(isAllowedFeedUrl("https://user:pass@example.com/rss")).toBe(false);
    });
});

describe("sanitizePublicHttpUrl", () => {
    it("keeps http and https URLs", () => {
        expect(sanitizePublicHttpUrl("https://example.com/a")).toBe("https://example.com/a");
        expect(sanitizePublicHttpUrl("http://example.com/a")).toBe("http://example.com/a");
    });

    it("rejects javascript and data URLs", () => {
        expect(sanitizePublicHttpUrl("javascript:alert(1)")).toBeNull();
        expect(sanitizePublicHttpUrl("data:text/html,hi")).toBeNull();
    });

    it("rejects empty and invalid values", () => {
        expect(sanitizePublicHttpUrl("")).toBeNull();
        expect(sanitizePublicHttpUrl(null)).toBeNull();
        expect(sanitizePublicHttpUrl("not a url")).toBeNull();
    });
});

describe("isBlockedResolvedAddress", () => {
    it("blocks private, loopback, and link-local answers", () => {
        expect(isBlockedResolvedAddress("127.0.0.1")).toBe(true);
        expect(isBlockedResolvedAddress("10.1.2.3")).toBe(true);
        expect(isBlockedResolvedAddress("169.254.169.254")).toBe(true);
        expect(isBlockedResolvedAddress("::1")).toBe(true);
        expect(isBlockedResolvedAddress("fe80::1")).toBe(true);
        expect(isBlockedResolvedAddress("fd00::1")).toBe(true);
        expect(isBlockedResolvedAddress("::ffff:127.0.0.1")).toBe(true);
        expect(isBlockedResolvedAddress("::ffff:a9fe:a9fe")).toBe(true);
    });

    it("allows public answers", () => {
        expect(isBlockedResolvedAddress("93.184.216.34")).toBe(false);
        expect(isBlockedResolvedAddress("2606:4700:4700::1111")).toBe(false);
        expect(isBlockedResolvedAddress("::ffff:8.8.8.8")).toBe(false);
    });
});

const TINY_RSS = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>Hello</title><link>https://example.com/hello</link></item></channel></rss>`;

describe("fetchFeedItems", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("does not fetch a hostname that resolves to a private address", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const result = await fetchFeedItems(
            { title: "Feed", feedUrl: "https://example.com/rss" },
            { lookup: async () => ["169.254.169.254"] }
        );

        expect(result.status).toBe("error");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("checks the address a redirect resolves to before following it", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(null, {
                status: 302,
                headers: { location: "https://internal.example/rss" },
            });
        });
        vi.stubGlobal("fetch", fetchMock);

        const result = await fetchFeedItems(
            { title: "Feed", feedUrl: "https://example.com/rss" },
            {
                lookup: async (hostname) => {
                    if (hostname === "internal.example") return ["10.0.0.8"];
                    return ["93.184.216.34"];
                },
            }
        );

        expect(result.status).toBe("error");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("rejects a response whose Content-Length is over the cap before reading it", async () => {
        let read = false;
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers({ "content-length": String(FEED_MAX_BYTES + 1) }),
                    body: {
                        getReader() {
                            read = true;
                            throw new Error("body should not be read");
                        },
                        cancel: async () => {},
                    },
                };
            })
        );

        const result = await fetchFeedItems(
            { title: "Feed", feedUrl: "https://example.com/rss" },
            { lookup: async () => ["93.184.216.34"] }
        );

        expect(result).toEqual({ status: "error", message: "Feed response too large" });
        expect(read).toBe(false);
    });

    it("stops reading a stream once the byte cap is passed", async () => {
        let reads = 0;
        const body = {
            getReader() {
                return {
                    async read() {
                        reads += 1;
                        return { done: false, value: new Uint8Array(4) };
                    },
                    async cancel() {},
                    releaseLock() {},
                };
            },
            cancel: async () => {},
        };
        const response = {
            headers: new Headers(),
            body,
        } as unknown as Response;

        const result = await readCappedBody(response, 6);
        expect(result).toBeNull();
        expect(reads).toBe(2);
    });

    it("parses a small public feed", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response(TINY_RSS, { status: 200 })));

        const result = await fetchFeedItems(
            { title: "Feed", feedUrl: "https://example.com/rss" },
            { lookup: async () => ["93.184.216.34"] }
        );

        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            expect(result.items[0].title).toBe("Hello");
        }
    });
});
