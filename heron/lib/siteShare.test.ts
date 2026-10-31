import { describe, expect, it } from "vitest";
import { createDefaultFrontPageConfig } from "@/lib/frontPage";
import { contactLinksFromFrontPage, ogImageUrl, siteDescription } from "./siteShare";
import { legacyBuiltInFrontPage } from "./siteTemplates/legacyDefault";

describe("site share metadata", () => {
    it("uses a saved description, then the banner subtitle", () => {
        const front = JSON.stringify(createDefaultFrontPageConfig());
        expect(siteDescription("  Pictures and notes.  ", front)).toBe("Pictures and notes.");
        expect(siteDescription("", front)).toBe("Photographs, notes, and the work in between.");
        expect(siteDescription(null, null)).toBe("Photographs, notes, and the work in between.");
    });

    it("uses a saved share image, then the album cover", () => {
        expect(ogImageUrl(" https://cdn.example/og.jpg ", "https://cdn.example/cover.jpg")).toBe(
            "https://cdn.example/og.jpg"
        );
        expect(ogImageUrl("  ", "https://cdn.example/cover.jpg")).toBe("https://cdn.example/cover.jpg");
        expect(ogImageUrl(null, null)).toBeNull();
    });

    it("reads contact links from the homepage and keeps the old seed's briefcase icon out of Journal", () => {
        const links = contactLinksFromFrontPage(JSON.stringify(createDefaultFrontPageConfig()));
        expect(links.map((link) => link.label)).toEqual(["Email", "GitHub", "LinkedIn", "Resume"]);
        expect(links.some((link) => link.icon === "Linkedin")).toBe(true);
        const legacy = contactLinksFromFrontPage(JSON.stringify(legacyBuiltInFrontPage));
        expect(legacy.some((link) => link.icon === "Briefcase")).toBe(true);
    });
});
