import { describe, it, expect } from "vitest";
import { formatPartialDate, formatDateRange } from "./format";

describe("lib/resume/format", () => {
    it("formats a valid YYYY-MM as Mon YYYY", () => {
        expect(formatPartialDate("2021-06")).toBe("Jun 2021");
        expect(formatPartialDate("2021-01")).toBe("Jan 2021");
        expect(formatPartialDate("2021-12")).toBe("Dec 2021");
    });

    it("formats a year-only value as the year", () => {
        expect(formatPartialDate("2021")).toBe("2021");
    });

    it("passes through invalid months, trailing junk, and non-dates", () => {
        expect(formatPartialDate("2021-13")).toBe("2021-13");
        expect(formatPartialDate("2021-06junk")).toBe("2021-06junk");
        expect(formatPartialDate("Present")).toBe("Present");
    });

    it("renders an empty end date as Present", () => {
        expect(formatDateRange("2021-06", "")).toBe("Jun 2021 – Present");
        expect(formatDateRange("2021-06", "2024-01")).toBe("Jun 2021 – Jan 2024");
    });
});
