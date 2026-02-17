import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { jsonRequest, getRequest, MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/services/admin-users", () => ({
  listUsers: vi.fn(),
  createUser: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { listUsers, createUser } = await import("@/services/admin-users");

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(listUsers).mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("returns 200 with users when authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(listUsers).mockResolvedValue([
      { id: 1, email: "a@test.com", isBaseAdmin: true, createdAt: "2024-01-01T00:00:00Z" }
    ] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual({ id: 1, email: "a@test.com", is_base_admin: true, created_at: "2024-01-01T00:00:00Z" });
  });
});

describe("POST /api/admin/users", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(createUser).mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await POST(jsonRequest("POST", "http://x", { email: "new@test.com" }));
    expect(res.status).toBe(401);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 400 when email is missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("email is required");
  });

  it("returns 400 when email is blank", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", { email: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with user when created", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(createUser).mockResolvedValue({
      id: 2,
      email: "new@test.com",
      isBaseAdmin: false,
      createdAt: "2024-01-15T00:00:00Z"
    } as never);
    const res = await POST(jsonRequest("POST", "http://x", { email: "new@test.com" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({
      id: 2,
      email: "new@test.com",
      is_base_admin: false,
      created_at: "2024-01-15T00:00:00Z"
    });
    expect(createUser).toHaveBeenCalledWith("new@test.com");
  });

  it("returns 409 when user already exists", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(createUser).mockResolvedValue(null);
    const res = await POST(jsonRequest("POST", "http://x", { email: "existing@test.com" }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already exists");
  });
});
