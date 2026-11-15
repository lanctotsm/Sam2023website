import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { resetRateLimits } from "@/lib/rate-limit";

vi.mock("@/services/contact-messages", () => ({
    createContactMessage: vi.fn()
}));

vi.mock("@/lib/contact-mail", () => ({
    loadContactMailConfig: vi.fn(async () => null),
    sendContactMail: vi.fn()
}));

const { createContactMessage } = await import("@/services/contact-messages");
const { loadContactMailConfig, sendContactMail } = await import("@/lib/contact-mail");

const message = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Hello from the form."
};

function post(body: unknown, address = "203.0.113.10") {
    return new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": address
        },
        body: JSON.stringify(body)
    });
}

describe("POST /api/contact", () => {
    beforeEach(() => {
        resetRateLimits();
        vi.mocked(createContactMessage).mockReset();
        vi.mocked(createContactMessage).mockResolvedValue({ id: 1 } as never);
        vi.mocked(loadContactMailConfig).mockReset();
        vi.mocked(loadContactMailConfig).mockResolvedValue(null);
        vi.mocked(sendContactMail).mockReset();
        vi.mocked(sendContactMail).mockResolvedValue(undefined);
    });

    it("stores a message and does not mention a recipient", async () => {
        const res = await POST(post(message));
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(JSON.parse(text)).toEqual({ ok: true });
        expect(text).not.toContain("@");
        expect(createContactMessage).toHaveBeenCalledWith(message);
        expect(sendContactMail).not.toHaveBeenCalled();
    });

    it("still returns success when notification mail fails", async () => {
        vi.mocked(loadContactMailConfig).mockResolvedValue({
            to: "inbox@example.com",
            from: "site@example.com",
            region: "us-east-1"
        });
        vi.mocked(sendContactMail).mockRejectedValue(new Error("ses down"));
        const res = await POST(post(message, "203.0.113.11"));
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).not.toContain("inbox@example.com");
        expect(createContactMessage).toHaveBeenCalled();
    });

    it("does not store a honeypot submission", async () => {
        const res = await POST(post({ ...message, hp_token: "bot" }, "203.0.113.12"));
        expect(res.status).toBe(200);
        expect(createContactMessage).not.toHaveBeenCalled();
    });

    it("rejects a body larger than 16KB before storing it", async () => {
        const res = await POST(
            new Request("http://localhost:3000/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "203.0.113.16",
                    "content-length": String(20 * 1024)
                },
                body: JSON.stringify({ ...message, message: "x".repeat(20 * 1024) })
            })
        );
        expect(res.status).toBe(413);
        expect(createContactMessage).not.toHaveBeenCalled();
    });

    it("returns 400 for an empty message", async () => {
        const res = await POST(post({ ...message, message: "" }, "203.0.113.13"));
        expect(res.status).toBe(400);
        expect(createContactMessage).not.toHaveBeenCalled();
    });

    it("returns 429 after the per-address limit", async () => {
        const address = "203.0.113.14";
        for (let i = 0; i < 5; i += 1) {
            const res = await POST(post(message, address));
            expect(res.status).toBe(200);
        }
        const blocked = await POST(post(message, address));
        expect(blocked.status).toBe(429);
    });

    it("returns 500 when the message cannot be stored", async () => {
        vi.mocked(createContactMessage).mockRejectedValue(new Error("db down"));
        const res = await POST(post(message, "203.0.113.15"));
        expect(res.status).toBe(500);
        expect(sendContactMail).not.toHaveBeenCalled();
    });
});
