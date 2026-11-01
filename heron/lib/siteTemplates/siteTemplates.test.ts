import { describe, expect, it } from "vitest";
import { createDefaultFrontPageConfig } from "@/lib/frontPage";
import { defaultPageStyles, parseFrontPageConfig } from "@/lib/frontPageDefaults";
import { sanitizeTemplateData } from "@/lib/homeSectionTemplates";
import { describeLiveTemplate, isUntouchedSite, normalizeSnapshot, snapshotsEqual } from "./compare";
import { legacyBuiltInFrontPage } from "./legacyDefault";
import { getFieldNotesPreset, getJournalPreset, getSiteTemplatePresets } from "./presets";

describe("site template presets", () => {
    it("keeps the pre-template homepage frozen when Journal becomes the default", () => {
        expect(legacyBuiltInFrontPage).not.toEqual(createDefaultFrontPageConfig());
        const about = legacyBuiltInFrontPage.sections.find((section) => section.label === "About");
        expect(about?.templateId).toBe("text-block");
        if (about?.templateId === "text-block") {
            expect(about.data.heading).toBe("About Me");
        }
        const contact = legacyBuiltInFrontPage.sections.find((section) => section.templateId === "contact");
        if (contact?.templateId === "contact") {
            expect(contact.data.links.some((link) => link.icon === "Briefcase")).toBe(true);
        }
        expect(createDefaultFrontPageConfig()).toEqual(getJournalPreset().snapshot.front_page);
    });

    it("ships two different kits", () => {
        const journal = getJournalPreset();
        const fieldNotes = getFieldNotesPreset();
        expect(journal.id).toBe("journal");
        expect(fieldNotes.id).toBe("field-notes");
        expect(snapshotsEqual(journal.snapshot, fieldNotes.snapshot)).toBe(false);
        expect(snapshotsEqual(journal.snapshot.front_page, legacyBuiltInFrontPage)).toBe(false);

        const banner = journal.snapshot.front_page.sections[0];
        expect(banner?.templateId).toBe("banner");
        if (banner?.templateId === "banner") {
            expect(banner.data.variant).toBe("canvas");
        }
        const contact = journal.snapshot.front_page.sections.find((section) => section.templateId === "contact");
        expect(contact?.templateId).toBe("contact");
        if (contact?.templateId === "contact") {
            expect(contact.data.links.some((link) => link.icon === "Linkedin")).toBe(true);
        }
        expect(journal.snapshot.front_page.sections.map((section) => section.templateId)).toEqual([
            "banner",
            "text-block",
            "recent-work",
            "contact",
        ]);
        expect(fieldNotes.snapshot.front_page.sections[1]?.templateId).toBe("recent-work");
        expect(fieldNotes.snapshot.page_styles.home.style.headingFont).toBe("Crimson Text");
        expect(fieldNotes.snapshot.nav_styles.bgColor).toBe("#1c1917");
        expect(journal.snapshot.page_styles.albums.style.headingFont).toBe("Fraunces");
    });

    it("treats a seed homepage without banner variant as untouched when styles are empty", () => {
        const seed = structuredClone(legacyBuiltInFrontPage);
        const banner = seed.sections[0];
        if (banner?.templateId === "banner") {
            delete (banner.data as { variant?: string }).variant;
        }
        expect(isUntouchedSite(JSON.stringify(seed), null, "")).toBe(true);
        expect(isUntouchedSite(null, null, null)).toBe(true);
        expect(isUntouchedSite(JSON.stringify(legacyBuiltInFrontPage), JSON.stringify(defaultPageStyles), null)).toBe(true);
    });

    it("leaves a customized homepage or styled site alone", () => {
        expect(isUntouchedSite(JSON.stringify(getJournalPreset().snapshot.front_page), null, null)).toBe(false);
        const styled = structuredClone(defaultPageStyles);
        styled.home.style.headingFont = "Roboto";
        expect(isUntouchedSite(JSON.stringify(legacyBuiltInFrontPage), JSON.stringify(styled), null)).toBe(false);
    });

    it("ignores key order when comparing a live site to a preset", () => {
        const snapshot = getJournalPreset().snapshot;
        const shuffled = {
            nav_styles: snapshot.nav_styles,
            page_styles: snapshot.page_styles,
            front_page: snapshot.front_page,
        };
        expect(normalizeSnapshot(shuffled)).not.toBeNull();
        expect(snapshotsEqual(normalizeSnapshot(snapshot), normalizeSnapshot(shuffled))).toBe(true);
        const status = describeLiveTemplate("", snapshot, getSiteTemplatePresets(), []);
        expect(status).toEqual({ id: "journal", name: "Journal", edited: false });
    });

    it("marks the live site edited when it diverges from the applied template", () => {
        const snapshot = structuredClone(getJournalPreset().snapshot);
        snapshot.front_page.sections[0] = {
            ...snapshot.front_page.sections[0],
            data: { ...(snapshot.front_page.sections[0].data as object), title: "Edited" },
        } as (typeof snapshot.front_page.sections)[number];
        const status = describeLiveTemplate("journal", snapshot, getSiteTemplatePresets(), []);
        expect(status.edited).toBe(true);
        expect(status.name).toBe("Journal");
    });

    it("keeps an unknown banner treatment on the rounded panel", () => {
        const parsed = parseFrontPageConfig(
            JSON.stringify({
                sections: [
                    {
                        id: "b",
                        templateId: "banner",
                        label: "Top banner",
                        data: {
                            title: "Hello",
                            subtitle: "",
                            backgroundType: "gradient",
                            backgroundColor: "",
                            backgroundImage: "",
                            gradientFrom: "",
                            gradientTo: "",
                            variant: "mosaic",
                        },
                    },
                ],
                sectionOrder: ["b"],
            })
        );
        const banner = parsed.sections[0];
        expect(banner?.templateId).toBe("banner");
        if (banner?.templateId === "banner") expect(banner.data.variant).toBe("panel");

        const recent = sanitizeTemplateData("recent-work", {
            heading: "Now",
            albumLimit: 40,
            postLimit: 0,
            showAlbums: false,
            showPosts: "yes",
        });
        expect(recent).toMatchObject({ heading: "Now", albumLimit: 12, postLimit: 1, showAlbums: false, showPosts: true });
    });
});
