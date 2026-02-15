import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { jsonRequest, MOCK_AUTH_USER } from "../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (msg: string, status: number) => new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/services/images", () => ({ getAllImages: vi.fn(), createImage: vi.fn() }));
vi.mock("@/lib/serializers", () => ({ serializeImage: (i: unknown) => i }));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAllImages, createImage } = await import("@/services/images");

describe("IMAGES /api/images", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    vi.mocked(getAllImages).mockResolvedValue([]);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns 200 when authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(getAllImages).mockResolvedValue([{ id: 1, s3Key: "k", width: null, height: null, caption: null, altText: null, createdBy: 1, createdAt: "" }] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json())).toHaveLength(1);
  });

  it("POST returns 401 when unauthenticated", async () => {
    const res = await POST(jsonRequest("POST", "http://x", { s3_key: "k" }));
    expect(res.status).toBe(401);
  });

  it("POST returns 400 when s3_key missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    const res = await POST(jsonRequest("POST", "http://x", {}));
    expect(res.status).toBe(400);
  });

  it("POST returns 201 when valid", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
    vi.mocked(createImage).mockResolvedValue({ id: 1, s3Key: "k", width: null, height: null, caption: null, altText: null, createdBy: 1, createdAt: "" } as never);
    const res = await POST(jsonRequest("POST", "http://x", { s3_key: "k" }));
    expect(res.status).toBe(201);
    expect(createImage).toHaveBeenCalledWith(expect.objectContaining({ s3Key: "k", createdBy: 1 }));
  });
});
