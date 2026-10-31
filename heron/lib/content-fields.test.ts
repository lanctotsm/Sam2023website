import { describe, expect, it } from "vitest";
import { displayDateValue, optionalImageId } from "./content-fields";

describe("content fields", () => {
  it("keeps positive integer image ids", () => {
    expect(optionalImageId(4)).toBe(4);
    expect(optionalImageId("8")).toBe(8);
    expect(optionalImageId("")).toBeNull();
    expect(optionalImageId(0)).toBeNull();
    expect(optionalImageId("nope")).toBeNull();
  });

  it("keeps a calendar date and drops anything else", () => {
    expect(displayDateValue("2024-06-01")).toBe("2024-06-01");
    expect(displayDateValue("2024-06-01T12:00:00.000Z")).toBe("2024-06-01");
    expect(displayDateValue("")).toBeNull();
    expect(displayDateValue("June 1")).toBeNull();
  });
});
