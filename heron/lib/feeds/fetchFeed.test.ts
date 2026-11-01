import { describe, expect, it } from "vitest";
import { isAllowedFeedUrl, sanitizePublicHttpUrl } from "./fetchFeed";

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
