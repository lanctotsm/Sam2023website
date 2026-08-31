import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {}
}));

vi.mock("@/lib/admin-allowlist", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-allowlist")>();
  return {
    ...actual,
    isAllowedUserEmail: vi.fn()
  };
});

import { getServerSession } from "next-auth";
import { isAllowedUserEmail } from "@/lib/admin-allowlist";
import { getAuthUser } from "./api-utils";

describe("getAuthUser", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(isAllowedUserEmail).mockReset();
  });

  it("returns null when the session has an email but no user id", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: "gone@example.com", role: "admin" }
    } as never);

    await expect(getAuthUser()).resolves.toBeNull();
    expect(isAllowedUserEmail).not.toHaveBeenCalled();
  });

  it("returns null when the session email is no longer allowlisted", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 1, email: "gone@example.com", role: "admin" }
    } as never);
    vi.mocked(isAllowedUserEmail).mockResolvedValue(false);

    await expect(getAuthUser()).resolves.toBeNull();
  });

  it("returns the session user when the email is still allowlisted", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 2, email: "admin@example.com", role: "admin" }
    } as never);
    vi.mocked(isAllowedUserEmail).mockResolvedValue(true);

    await expect(getAuthUser()).resolves.toEqual({
      id: 2,
      email: "admin@example.com",
      role: "admin"
    });
  });

  it("returns a normalized email when the session email is mixed case", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 3, email: "Admin@Example.COM", role: "admin" }
    } as never);
    vi.mocked(isAllowedUserEmail).mockResolvedValue(true);

    await expect(getAuthUser()).resolves.toEqual({
      id: 3,
      email: "admin@example.com",
      role: "admin"
    });
  });
});
