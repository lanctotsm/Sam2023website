import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {}
}));

vi.mock("@/lib/admin-allowlist", () => ({
  isAllowedUserEmail: vi.fn()
}));

import { getServerSession } from "next-auth";
import { isAllowedUserEmail } from "@/lib/admin-allowlist";
import { getAuthUser } from "./api-utils";

describe("getAuthUser", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(isAllowedUserEmail).mockReset();
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
});
