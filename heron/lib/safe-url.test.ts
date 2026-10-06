import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "./safe-url";

describe("safeHttpUrl", () => {
  it("keeps http, https, mailto, tel, and same-site paths", () => {
    expect(safeHttpUrl("https://example.com/path")).toBe("https://example.com/path");
    expect(safeHttpUrl(" http://example.com ")).toBe("http://example.com");
    expect(safeHttpUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(safeHttpUrl("tel:+1-555-0100")).toBe("tel:+1-555-0100");
    expect(safeHttpUrl("/albums/coast")).toBe("/albums/coast");
  });

  it("drops scriptable and protocol-relative URLs", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBe("");
    expect(safeHttpUrl("data:text/html,hi")).toBe("");
    expect(safeHttpUrl("//evil.example")).toBe("");
    expect(safeHttpUrl("not a url")).toBe("");
    expect(safeHttpUrl("")).toBe("");
  });
});
