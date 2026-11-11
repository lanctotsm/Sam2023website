import { describe, it, expect } from "vitest";
import { metaDescription, publicPageMetadata } from "./site-metadata";

const LONG_TEXT = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");

describe("lib/site-metadata", () => {
  describe("metaDescription", () => {
    it("returns short text unchanged", () => {
      expect(metaDescription("A short summary.")).toBe("A short summary.");
    });

    it("collapses whitespace and newlines to single spaces", () => {
      expect(metaDescription("  Hello\n\n  world \t again  ")).toBe("Hello world again");
    });

    it("cuts long text at a word boundary and appends an ellipsis", () => {
      const result = metaDescription(LONG_TEXT);

      expect(result.endsWith("…")).toBe(true);
      expect(result.length).toBeLessThanOrEqual(160);
      expect(LONG_TEXT.startsWith(result.slice(0, -1))).toBe(true);
      // The character right after the cut is a space, so no word was split.
      expect(LONG_TEXT.charAt(result.length - 1)).toBe(" ");
    });

    it("strips trailing punctuation before the ellipsis", () => {
      const text = "one two three four, five six seven eight nine ten";

      expect(metaDescription(text, 20)).toBe("one two three four…");
    });

    it("hard-cuts a single word with no boundary to fit", () => {
      const result = metaDescription("a".repeat(300));

      expect(result.length).toBeLessThanOrEqual(160);
      expect(result).toBe("a".repeat(159) + "…");
    });

    it("returns an empty string for empty or whitespace-only input", () => {
      expect(metaDescription("")).toBe("");
      expect(metaDescription("  \n\t ")).toBe("");
    });
  });

  describe("publicPageMetadata", () => {
    it("applies metaDescription to the page, Open Graph, and Twitter descriptions", () => {
      const expected = metaDescription(LONG_TEXT);

      const metadata = publicPageMetadata({
        title: "Resume",
        description: LONG_TEXT,
        path: "/resume",
      });

      expect(metadata.description).toBe(expected);
      expect(metadata.openGraph?.description).toBe(expected);
      expect(metadata.twitter?.description).toBe(expected);
      expect(expected.length).toBeLessThanOrEqual(160);
    });
  });
});
