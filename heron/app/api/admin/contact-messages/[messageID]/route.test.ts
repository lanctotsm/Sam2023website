import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";
import { MOCK_AUTH_USER } from "@/app/api/__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
    getAuthUser: vi.fn(),
    parseId: (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : null),
    errorResponse: (msg: string, status: number) =>
        new Response(JSON.stringify({ error: msg }), { status })
}));

vi.mock("@/services/contact-messages", () => ({
    deleteContactMessage: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { deleteContactMessage } = await import("@/services/contact-messages");

function call(id: string) {
    return DELETE(new Request("http://localhost/api"), { params: Promise.resolve({ messageID: id }) });
}

describe("DELETE /api/admin/contact-messages/[messageID]", () => {
    beforeEach(() => {
        vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
        vi.mocked(deleteContactMessage).mockResolvedValue({ id: 3 } as never);
    });

    it("returns 401 when unauthenticated", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(null);
        const res = await call("3");
        expect(res.status).toBe(401);
        expect(deleteContactMessage).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid id", async () => {
        const res = await call("0");
        expect(res.status).toBe(400);
    });

    it("returns 404 when the message is already gone", async () => {
        vi.mocked(deleteContactMessage).mockResolvedValue(null as never);
        const res = await call("9");
        expect(res.status).toBe(404);
    });

    it("deletes a message", async () => {
        const res = await call("3");
        expect(res.status).toBe(200);
        expect(deleteContactMessage).toHaveBeenCalledWith(3);
        expect(await res.json()).toEqual({ status: "removed" });
    });
});
