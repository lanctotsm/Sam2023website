import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("lib/slug", () => {
  describe("slugify", () => {
    it("converts title to lowercase hyphenated slug", () => {
      expect(slugify("My Cool Post")).toBe("my-cool-post");
    });

    it("removes special characters", () => {
      expect(slugify("My Cool Post!")).toBe("my-cool-post");
      expect(slugify("What's Next?")).toBe("whats-next");
    });

    it("collapses multiple spaces and hyphens", () => {
      expect(slugify("Hello   World")).toBe("hello-world");
      expect(slugify("hello---world")).toBe("hello-world");
    });

    it("trims leading and trailing hyphens", () => {
      expect(slugify("  Hello World  ")).toBe("hello-world");
      expect(slugify("-hello-world-")).toBe("hello-world");
    });

    it("handles empty string", () => {
      expect(slugify("")).toBe("");
    });

    it("handles already slug-like input", () => {
      expect(slugify("my-cool-post")).toBe("my-cool-post");
    });
  });
});
