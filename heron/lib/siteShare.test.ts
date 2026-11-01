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

    it("hides contact links when socials are off and drops unsafe URLs", () => {
        const front = createDefaultFrontPageConfig();
        const contact = front.sections.find((section) => section.templateId === "contact");
        if (!contact || contact.templateId !== "contact") throw new Error("missing contact section");
        contact.data.showSocials = false;
        expect(contactLinksFromFrontPage(JSON.stringify(front))).toEqual([]);

        contact.data.showSocials = true;
        contact.data.links = [
            { label: "Bad", url: "javascript:alert(1)", icon: "Mail" },
            { label: "Site", url: "https://example.com", icon: "Link" },
        ];
        expect(contactLinksFromFrontPage(JSON.stringify(front)).map((link) => link.url)).toEqual([
            "https://example.com",
        ]);
    });
});
