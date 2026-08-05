import { describe, expect, it } from "vitest";
import { peechoFiletypeFromUrl } from "./catalog";

describe("peechoFiletypeFromUrl", () => {
  it("maps common extensions", () => {
    expect(peechoFiletypeFromUrl("https://cdn.example.com/a.png")).toBe("png");
    expect(peechoFiletypeFromUrl("https://cdn.example.com/a.WEBP?x=1")).toBe("webp");
    expect(peechoFiletypeFromUrl("https://cdn.example.com/a-original.jpg")).toBe("jpg");
    expect(peechoFiletypeFromUrl("https://cdn.example.com/noext")).toBe("jpg");
  });
});
