import { describe, expect, it } from "vitest";
import { isAllowedObjectKey } from "./object-key";

describe("isAllowedObjectKey", () => {
  it("allows keys under the prefixes the app writes", () => {
    expect(isAllowedObjectKey("uploads/uuid/large.jpg")).toBe(true);
    expect(isAllowedObjectKey("backgrounds/uuid.jpg")).toBe(true);
    expect(isAllowedObjectKey("pending/uuid/placeholder.jpg")).toBe(true);
  });

  it("rejects traversal and arbitrary keys", () => {
    expect(isAllowedObjectKey("k")).toBe(false);
    expect(isAllowedObjectKey("uploads/../secret")).toBe(false);
    expect(isAllowedObjectKey("/uploads/a.jpg")).toBe(false);
    expect(isAllowedObjectKey("uploads\\a.jpg")).toBe(false);
    expect(isAllowedObjectKey("")).toBe(false);
  });
});
