import { describe, expect, it } from "vitest";
import { readContactMailConfig } from "./contact-mail";

const complete = {
    CONTACT_TO_EMAIL: "inbox@example.com",
    CONTACT_FROM_EMAIL: "site@example.com",
    S3_REGION: "us-east-1"
} as NodeJS.ProcessEnv;

describe("readContactMailConfig", () => {
    it("returns null until both addresses are set", () => {
        expect(readContactMailConfig({} as NodeJS.ProcessEnv)).toBeNull();
        expect(readContactMailConfig({ ...complete, CONTACT_FROM_EMAIL: "  " })).toBeNull();
        expect(readContactMailConfig({ ...complete, CONTACT_TO_EMAIL: "" })).toBeNull();
    });

    it("reads the SES region from S3_REGION and defaults it to us-east-1", () => {
        expect(readContactMailConfig(complete)).toEqual({
            to: "inbox@example.com",
            from: "site@example.com",
            region: "us-east-1"
        });
        const withoutRegion = { ...complete };
        delete withoutRegion.S3_REGION;
        expect(readContactMailConfig(withoutRegion)?.region).toBe("us-east-1");
    });
});
