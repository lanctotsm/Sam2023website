import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
import { MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
    getAuthUser: vi.fn(),
    errorResponse: (msg: string, status: number) =>
        new Response(JSON.stringify({ error: msg }), { status })
}));

vi.mock("@/lib/contact-mail", () => ({
    loadContactNotifyView: vi.fn(),
    applyContactNotify: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { loadContactNotifyView, applyContactNotify } = await import("@/lib/contact-mail");

const saved = {
    email: "owner@example.com",
    region: "us-east-1",
    status: "pending" as const,
    notifiesByEmail: false,
    notice: "Amazon sent a confirmation link to this address."
};

function put(body: unknown) {
    return new Request("http://localhost:3000/api/admin/contact-mail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

describe("/api/admin/contact-mail", () => {
    beforeEach(() => {
        vi.mocked(getAuthUser).mockResolvedValue(null);
        vi.mocked(loadContactNotifyView).mockReset();
        vi.mocked(loadContactNotifyView).mockResolvedValue(saved);
        vi.mocked(applyContactNotify).mockReset();
        vi.mocked(applyContactNotify).mockResolvedValue(saved);
    });

    it("returns 401 when unauthenticated", async () => {
        expect((await GET()).status).toBe(401);
        expect((await PUT(put({ email: "owner@example.com" }))).status).toBe(401);
        expect(applyContactNotify).not.toHaveBeenCalled();
    });

    it("returns the confirmation state to an admin", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        const res = await GET();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(saved);
    });

    it("starts confirmation for one address", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        const res = await PUT(put({ email: "owner@example.com", resend: true }));
        expect(res.status).toBe(200);
        expect(applyContactNotify).toHaveBeenCalledWith("owner@example.com", true);
    });

    it("rejects an invalid address", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        const res = await PUT(put({ email: "nope" }));
        expect(res.status).toBe(400);
        expect(applyContactNotify).not.toHaveBeenCalled();
    });
});
