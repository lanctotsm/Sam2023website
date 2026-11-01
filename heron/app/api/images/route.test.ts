import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { MOCK_AUTH_USER } from "../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
  getAuthUser: vi.fn(),
  errorResponse: (msg: string, status: number) => new Response(JSON.stringify({ error: msg }), { status })
}));
vi.mock("@/services/images", () => ({ getAllImages: vi.fn() }));
vi.mock("@/lib/serializers", () => ({ serializeImage: (i: unknown) => i }));

const { getAuthUser } = await import("@/lib/api-utils");
const { getAllImages } = await import("@/services/images");

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
});
