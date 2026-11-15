import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
    getAuthUser: vi.fn(),
    errorResponse: (msg: string, status: number) =>
        new Response(JSON.stringify({ error: msg }), { status })
}));

vi.mock("@/services/contact-messages", () => ({
    listContactMessages: vi.fn()
}));

vi.mock("@/lib/contact-mail", () => ({
    contactMailIsConfigured: vi.fn(() => false)
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { listContactMessages } = await import("@/services/contact-messages");
const { contactMailIsConfigured } = await import("@/lib/contact-mail");

describe("GET /api/admin/contact-messages", () => {
    beforeEach(() => {
        vi.mocked(getAuthUser).mockResolvedValue(null);
        vi.mocked(listContactMessages).mockResolvedValue([]);
        vi.mocked(contactMailIsConfigured).mockReturnValue(false);
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await GET();
        expect(res.status).toBe(401);
        expect(listContactMessages).not.toHaveBeenCalled();
    });

    it("returns stored messages without a mail recipient", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        vi.mocked(listContactMessages).mockResolvedValue([
            {
                id: 4,
                name: "Ada",
                email: "ada@example.com",
                message: "Hello",
                createdAt: "2026-11-15T17:00:00.000Z"
            }
        ] as never);
        const res = await GET();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            notifiesByEmail: false,
            messages: [
                {
                    id: 4,
                    name: "Ada",
                    email: "ada@example.com",
                    message: "Hello",
                    created_at: "2026-11-15T17:00:00.000Z"
                }
            ]
        });
    });
});
