import { describe, it, expect } from "vitest";
import { formatPostDate } from "./format-post-date";

describe("formatPostDate", () => {
  it("returns empty string for missing dates", () => {
    expect(formatPostDate(null)).toBe("");
    expect(formatPostDate(undefined)).toBe("");
    expect(formatPostDate("")).toBe("");
  });

  it("formats with a short month by default", () => {
    expect(formatPostDate("2024-06-15T12:00:00.000Z")).toMatch(/Jun/);
  });

  it("formats with a long month when requested", () => {
    expect(formatPostDate("2024-06-15T12:00:00.000Z", "long")).toMatch(/June/);
  });
});
