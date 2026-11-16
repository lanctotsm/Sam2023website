import { describe, expect, it } from "vitest";
import { containsEmailAddress, redactEmails } from "./public-contact";

describe("redactEmails", () => {
    it("removes an address with a one-character top-level domain", () => {
        expect(containsEmailAddress("write a@b.c today")).toBe(true);
        expect(redactEmails("write a@b.c today")).toBe("write today");
    });
});
