import { describe, expect, it } from "vitest";
import { jwtIfStillAllowed, normalizeEmail } from "./admin-allowlist";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });

  it("returns empty string for missing values", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("jwtIfStillAllowed", () => {
  it("clears the token when the email is no longer allowed", async () => {
    const token = await jwtIfStillAllowed(
      { email: "gone@example.com", userId: 1, role: "admin" },
      async () => false
    );
    expect(token).toEqual({});
  });

  it("keeps the token when the email is still allowed", async () => {
    const existing = { email: "admin@example.com", userId: 1, role: "admin" };
    const token = await jwtIfStillAllowed(existing, async () => true);
    expect(token).toEqual(existing);
  });

  it("clears the token when email is missing", async () => {
    const token = await jwtIfStillAllowed({ userId: 1 }, async () => true);
    expect(token).toEqual({});
  });
});
