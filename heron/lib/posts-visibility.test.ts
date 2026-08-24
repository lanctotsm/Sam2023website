import { describe, expect, it } from "vitest";
import { isPubliclyVisible } from "./posts-visibility";

const now = new Date("2026-08-23T20:00:00.000Z");

describe("isPubliclyVisible", () => {
  it("hides drafts", () => {
    expect(isPubliclyVisible({ status: "draft", publishedAt: null }, now)).toBe(false);
  });

  it("hides archived posts", () => {
    expect(isPubliclyVisible({ status: "archived", publishedAt: null }, now)).toBe(false);
  });

  it("shows published posts with no scheduled time", () => {
    expect(isPubliclyVisible({ status: "published", publishedAt: null }, now)).toBe(true);
  });

  it("shows published posts whose publishedAt is in the past", () => {
    expect(
      isPubliclyVisible({ status: "published", publishedAt: "2026-08-01T00:00:00.000Z" }, now)
    ).toBe(true);
  });

  it("hides published posts whose publishedAt is in the future", () => {
    expect(
      isPubliclyVisible({ status: "published", publishedAt: "2026-12-01T00:00:00.000Z" }, now)
    ).toBe(false);
  });
});
