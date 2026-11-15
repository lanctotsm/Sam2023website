import { describe, expect, it } from "vitest";
import {
    contactNotifyView,
    describeIdentity,
    noticeForPendingIdentity,
    parseContactNotifyRequest
} from "./contact-notify";

describe("parseContactNotifyRequest", () => {
    it("accepts one address or a blank address", () => {
        expect(parseContactNotifyRequest({ email: " owner@example.com ", resend: true })).toEqual({
            ok: true,
            email: "owner@example.com",
            resend: true
        });
        expect(parseContactNotifyRequest({ email: "  " })).toEqual({ ok: true, email: "", resend: false });
    });

    it("rejects an invalid address", () => {
        expect(parseContactNotifyRequest({ email: "not-an-email" }).ok).toBe(false);
        expect(parseContactNotifyRequest(null).ok).toBe(false);
    });
});

describe("describeIdentity", () => {
    it("treats a missing identity as waiting to send the link", () => {
        expect(describeIdentity(null)).toBe("pending");
        expect(noticeForPendingIdentity(null)).toContain("Send a confirmation link");
    });

    it("treats a clicked link as confirmed", () => {
        expect(describeIdentity({ verifiedForSending: true, verificationStatus: "SUCCESS" })).toBe("verified");
        expect(describeIdentity({ verifiedForSending: false, verificationStatus: "SUCCESS" })).toBe("verified");
    });

    it("keeps an unclicked link pending and an expired link failed", () => {
        expect(describeIdentity({ verifiedForSending: false, verificationStatus: "PENDING" })).toBe("pending");
        expect(noticeForPendingIdentity({ verifiedForSending: false, verificationStatus: "PENDING" })).toContain(
            "click the link"
        );
        expect(describeIdentity({ verifiedForSending: false, verificationStatus: "FAILED" })).toBe("failed");
    });
});

describe("contactNotifyView", () => {
    it("emails only after the address is confirmed", () => {
        expect(contactNotifyView({ email: "a@b.co", region: "us-east-1", status: "verified" }).notifiesByEmail).toBe(
            true
        );
        expect(contactNotifyView({ email: "a@b.co", region: "us-east-1", status: "pending" }).notifiesByEmail).toBe(
            false
        );
    });
});
