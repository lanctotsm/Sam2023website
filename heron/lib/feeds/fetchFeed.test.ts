import { describe, expect, it } from "vitest";
import { isAllowedFeedUrl } from "./fetchFeed";

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
});
