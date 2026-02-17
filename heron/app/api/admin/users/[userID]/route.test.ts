import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";
import { getParams, MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  parseId: (v: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  errorResponse: (msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/actions/admin-users", () => ({ removeUser: vi.fn() }));

const { getAuthUser } = await import("@/lib/api-utils");
const { removeUser } = await import("@/actions/admin-users");

describe("DELETE /api/admin/users/[userID]", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(removeUser).mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await DELETE(new Request("http://x"), { params: getParams({ userID: "1" }) });
    expect(res.status).toBe(401);
    expect(removeUser).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid user id", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await DELETE(new Request("http://x"), { params: getParams({ userID: "abc" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("invalid user id");
  });

  it("returns 200 when user removed", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await DELETE(new Request("http://x"), { params: getParams({ userID: "5" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("removed");
    expect(removeUser).toHaveBeenCalledWith(5);
  });

  it("returns 403 when remove throws cannot remove", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(removeUser).mockRejectedValue(new Error("cannot remove last admin"));
    const res = await DELETE(new Request("http://x"), { params: getParams({ userID: "1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when remove throws not found", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(removeUser).mockRejectedValue(new Error("user not found"));
    const res = await DELETE(new Request("http://x"), { params: getParams({ userID: "999" }) });
    expect(res.status).toBe(404);
  });
});
