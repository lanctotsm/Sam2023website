import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  getDb: () => mockGetDb()
}));

import {
  getAllowedAdminUser,
  isAllowedUserEmail,
  jwtIfStillAllowed,
  sessionUserFromToken,
  normalizeEmail
} from "./admin-allowlist";

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

  it("normalizes the email on a kept token", async () => {
    const token = await jwtIfStillAllowed(
      { email: "Admin@Example.COM", userId: 1, role: "admin" },
      async () => true
    );
    expect(token).toEqual({ email: "admin@example.com", userId: 1, role: "admin" });
  });

  it("clears the token when email is missing", async () => {
    const token = await jwtIfStillAllowed({ userId: 1 }, async () => true);
    expect(token).toEqual({});
  });
});

describe("sessionUserFromToken", () => {
  it("returns null when the jwt was cleared", () => {
    expect(sessionUserFromToken({})).toBeNull();
    expect(sessionUserFromToken({ email: "gone@example.com" })).toBeNull();
  });

  it("returns the user when userId and email are present", () => {
    expect(
      sessionUserFromToken({ email: "admin@example.com", userId: 2, role: "admin", name: "Pat" })
    ).toEqual({
      id: 2,
      email: "admin@example.com",
      role: "admin",
      name: "Pat"
    });
  });
});

function restoreBaseAdminEmail(original: string | undefined) {
  if (original === undefined) {
    delete process.env.BASE_ADMIN_EMAIL;
    return;
  }
  process.env.BASE_ADMIN_EMAIL = original;
}

function mockAdminLookup(rows: { id: number; name: string }[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const insert = vi.fn();
  mockGetDb.mockReturnValue({ select, insert });
  return { select, insert };
}

describe("isAllowedUserEmail", () => {
  const originalBaseAdmin = process.env.BASE_ADMIN_EMAIL;

  beforeEach(() => {
    mockGetDb.mockReset();
  });

  afterEach(() => {
    restoreBaseAdminEmail(originalBaseAdmin);
  });

  it("allows the base admin without writing to the database", async () => {
    process.env.BASE_ADMIN_EMAIL = "Dev@Local";
    const insert = vi.fn();
    mockGetDb.mockReturnValue({ insert, select: vi.fn() });

    await expect(isAllowedUserEmail("  DEV@local ")).resolves.toBe(true);
    expect(insert).not.toHaveBeenCalled();
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it("allows an invited admin after normalizing the email", async () => {
    delete process.env.BASE_ADMIN_EMAIL;
    const { insert } = mockAdminLookup([{ id: 4, name: "Pat" }]);

    await expect(isAllowedUserEmail("  Invited@X.COM ")).resolves.toBe(true);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects an email with no admin_users row", async () => {
    delete process.env.BASE_ADMIN_EMAIL;
    const { insert } = mockAdminLookup([]);

    await expect(isAllowedUserEmail("gone@example.com")).resolves.toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("getAllowedAdminUser", () => {
  const originalBaseAdmin = process.env.BASE_ADMIN_EMAIL;

  beforeEach(() => {
    mockGetDb.mockReset();
  });

  afterEach(() => {
    restoreBaseAdminEmail(originalBaseAdmin);
  });

  it("upserts the base admin using a normalized email", async () => {
    process.env.BASE_ADMIN_EMAIL = "Dev@Local";
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const insert = vi.fn(() => ({ values }));
    mockGetDb.mockReturnValue({ insert, select: vi.fn() });

    await expect(getAllowedAdminUser("  DEV@local ")).resolves.toEqual({ name: "Base Admin" });
    expect(values).toHaveBeenCalledWith({
      email: "dev@local",
      isBaseAdmin: true,
      name: "Base Admin"
    });
  });
});
