import { describe, expect, it } from "vitest";
import { readContactMailConfig } from "./contact-mail";

const complete = {
    CONTACT_TO_EMAIL: "inbox@example.com",
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "mailer@example.com",
    SMTP_PASS: "secret",
    SMTP_FROM: "site@example.com"
} as NodeJS.ProcessEnv;

describe("readContactMailConfig", () => {
    it("returns null until every required value is set", () => {
        expect(readContactMailConfig({} as NodeJS.ProcessEnv)).toBeNull();
        expect(readContactMailConfig({ ...complete, SMTP_PASS: "  " })).toBeNull();
    });

    it("reads a STARTTLS setup and does not treat port 587 as implicit TLS", () => {
        expect(readContactMailConfig(complete)).toEqual({
            to: "inbox@example.com",
            host: "smtp.example.com",
            port: 587,
            user: "mailer@example.com",
            pass: "secret",
            from: "site@example.com",
            secure: false
        });
    });

    it("uses implicit TLS for port 465 unless SMTP_SECURE is false", () => {
        expect(readContactMailConfig({ ...complete, SMTP_PORT: "465" })?.secure).toBe(true);
        expect(readContactMailConfig({ ...complete, SMTP_PORT: "465", SMTP_SECURE: "false" })?.secure).toBe(false);
    });

    it("rejects a port that is not a TCP port", () => {
        expect(readContactMailConfig({ ...complete, SMTP_PORT: "0" })).toBeNull();
        expect(readContactMailConfig({ ...complete, SMTP_PORT: "smtp" })).toBeNull();
    });
});
