import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn()
}));

import { authOptions } from "./auth";

describe("auth session callback", () => {
  it("omits session.user when the jwt was cleared", async () => {
    const sessionCallback = authOptions.callbacks?.session;
    expect(sessionCallback).toBeTypeOf("function");

    const result = await sessionCallback({
      session: {
        user: {
          id: 1,
          email: "gone@example.com",
          role: "admin",
          name: "Pat"
        },
        expires: "2099-01-01T00:00:00.000Z"
      },
      token: {},
      user: undefined as never
    });

    expect(result.user).toBeUndefined();
  });

  it("does not keep email from the incoming session when the jwt is empty", async () => {
    const sessionCallback = authOptions.callbacks?.session;
    expect(sessionCallback).toBeTypeOf("function");

    const result = await sessionCallback({
      session: {
        user: { email: "gone@example.com" },
        expires: "2099-01-01T00:00:00.000Z"
      },
      token: { email: "gone@example.com" },
      user: undefined as never
    });

    expect(result.user).toBeUndefined();
  });

  it("copies identity from a valid token", async () => {
    const sessionCallback = authOptions.callbacks?.session;
    expect(sessionCallback).toBeTypeOf("function");

    const result = await sessionCallback({
      session: {
        user: { name: "Fallback" },
        expires: "2099-01-01T00:00:00.000Z"
      },
      token: { email: "admin@example.com", userId: 2, role: "admin", name: "Pat" },
      user: undefined as never
    });

    expect(result.user).toEqual({
      name: "Pat",
      id: 2,
      email: "admin@example.com",
      role: "admin"
    });
  });
});
