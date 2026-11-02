import { describe, expect, it } from "vitest";
import { parsePostInput } from "./post-input";

const valid = { title: "Title", slug: "post", markdown: "Body" };

describe("post input validation", () => {
  it.each([
    null, [], "text", 42,
    { ...valid, title: 1 }, { ...valid, markdown: false }, { ...valid, summary: {} },
    { ...valid, slug: "../admin" }, { ...valid, slug: "post?draft=true" }, { ...valid, slug: "%2f" },
    { ...valid, status: "publshed" }, { ...valid, status: 1 },
    { ...valid, published_at: "not a date" }, { ...valid, published_at: 123 },
    { ...valid, published_at: "2026-02-30T12:00:00Z" },
    { ...valid, published_at: "2026-11-02T12:00:00" },
    { ...valid, published_at: "2026-11-02T24:00:00Z" },
    { ...valid, metadata: [] }, { ...valid, metadata: { author: { name: "Sam" } } },
    { ...valid, inline_image_ids: "1,2" }, { ...valid, inline_image_ids: [1, 0] },
    { ...valid, inline_image_ids: ["1"] }, { ...valid, inline_image_ids: [1.5] },
    { ...valid, inline_image_ids: [Number.MAX_SAFE_INTEGER + 1] }
  ])("rejects invalid input: %j", (payload) => {
    expect(parsePostInput(payload).ok).toBe(false);
  });

  it("normalizes timestamps to UTC for chronological SQLite comparisons", () => {
    expect(parsePostInput({
      ...valid,
      title: " Title ",
      status: " Published ",
      published_at: "2026-11-02T08:30:00-05:00",
      inline_image_ids: [1, 2, 1],
      metadata: { author: "Sam" }
    })).toEqual({
      ok: true,
      data: {
        ...valid, summary: "", status: "published", publishedAt: "2026-11-02T13:30:00.000Z",
        inlineImageIds: [1, 2], metadata: { author: "Sam" }
      }
    });
  });

  it("distinguishes omitted image relationships from an explicit clear", () => {
    const omitted = parsePostInput(valid);
    const cleared = parsePostInput({ ...valid, inline_image_ids: [] });
    expect(omitted.ok && omitted.data.inlineImageIds).toBeUndefined();
    expect(cleared.ok && cleared.data.inlineImageIds).toEqual([]);
  });
});
