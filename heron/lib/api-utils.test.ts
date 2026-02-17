import { describe, it, expect } from "vitest";
import { errorResponse, normalizeStatus, parseId } from "./api-utils";

describe("lib/api-utils", () => {
  describe("errorResponse", () => {
    it("returns JSON response with error message and status", async () => {
      const res = errorResponse("bad request", 400);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ error: "bad request" });
    });

    it("returns 500 for server errors", async () => {
      const res = errorResponse("internal error", 500);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe("internal error");
    });
  });

  describe("normalizeStatus", () => {
    it('returns "published" for published (case insensitive)', () => {
      expect(normalizeStatus("published")).toBe("published");
      expect(normalizeStatus("Published")).toBe("published");
      expect(normalizeStatus("PUBLISHED")).toBe("published");
    });

    it('returns "archived" for archived', () => {
      expect(normalizeStatus("archived")).toBe("archived");
      expect(normalizeStatus("Archived")).toBe("archived");
    });

    it('returns "draft" for draft or unknown', () => {
      expect(normalizeStatus("draft")).toBe("draft");
      expect(normalizeStatus("")).toBe("draft");
      expect(normalizeStatus(null)).toBe("draft");
      expect(normalizeStatus(undefined)).toBe("draft");
      expect(normalizeStatus("unknown")).toBe("draft");
    });

    it("trims whitespace", () => {
      expect(normalizeStatus("  published  ")).toBe("published");
    });
  });

  describe("parseId", () => {
    it("returns number for positive integer string", () => {
      expect(parseId("1")).toBe(1);
      expect(parseId("42")).toBe(42);
      expect(parseId("999")).toBe(999);
    });

    it("returns null for zero or negative", () => {
      expect(parseId("0")).toBeNull();
      expect(parseId("-1")).toBeNull();
    });

    it("returns null for non-integer", () => {
      expect(parseId("abc")).toBeNull();
      expect(parseId("1.5")).toBeNull();
      expect(parseId("")).toBeNull();
    });
  });
});
