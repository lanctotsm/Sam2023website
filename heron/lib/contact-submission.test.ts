import { describe, expect, it } from "vitest";
import { parseContactSubmission } from "./contact-submission";

const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Hello there."
};

describe("parseContactSubmission", () => {
    it("accepts a normal message", () => {
        expect(parseContactSubmission(valid)).toEqual({ status: "ok", value: valid });
    });

    it("ignores a filled honeypot without echoing it", () => {
        expect(parseContactSubmission({ ...valid, hp_token: "https://spam.example" })).toEqual({ status: "ignored" });
    });

    it("rejects a missing message", () => {
        expect(parseContactSubmission({ ...valid, message: "  " })).toEqual({
            status: "invalid",
            error: "Message is required."
        });
    });

    it("rejects an address that is not an email", () => {
        const result = parseContactSubmission({ ...valid, email: "not-an-email" });
        expect(result.status).toBe("invalid");
    });

    it("collapses newlines in the name so it cannot break a mail header", () => {
        const result = parseContactSubmission({ ...valid, name: "Ada\r\nBcc: victim@example.com" });
        expect(result).toEqual({
            status: "ok",
            value: { ...valid, name: "Ada Bcc: victim@example.com" }
        });
    });
});
