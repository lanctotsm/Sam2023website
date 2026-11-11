import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { icons } from "lucide-react";
import { describe, expect, it } from "vitest";
import FrontPageContent from "@/components/FrontPageContent";
import LucideIcon from "@/components/LucideIcon";
import { legacyIconAliases } from "@/lib/icon-aliases";
import { parseFrontPageConfig, type FrontPageSettings } from "@/lib/frontPage";

function render(config: FrontPageSettings) {
    return renderToStaticMarkup(createElement(FrontPageContent, { config }));
}

describe("public home section rendering", () => {
    it("renders the default sections and icons without an editor UI", () => {
        const html = render(parseFrontPageConfig(null));
        expect(html).toContain("Samuel Lanctot");
        expect(html).toContain("About Me");
        expect(html).toContain("What I Do");
        expect(html).toContain("Beyond the Screen");
        expect(html).toContain("Connect");
        expect(html).toContain("<svg");
        expect(html).not.toContain("Pick icon");
        expect(html).not.toContain("<input");
        expect(html).not.toContain("<textarea");
    });

    it("preserves configured order, content, and arbitrary icon choices", () => {
        const html = render({
            sections: [
                { id: "text", templateId: "text-block", label: "Text", data: { heading: "Second section", paragraphs: ["Saved paragraph"] } },
                { id: "tags", templateId: "tag-list", label: "Tags", data: { heading: "First section", items: [{ icon: "Origami", label: "Paper folding" }] } }
            ],
            sectionOrder: ["tags", "missing-id", "text"]
        });
        expect(html.indexOf("First section")).toBeLessThan(html.indexOf("Second section"));
        expect(html).toContain("Saved paragraph");
        expect(html).toContain("Paper folding");
        expect(html).toContain("lucide-origami");
        expect(html).not.toContain("Unknown icon");
    });

    it.each(["Camera", "TrainTrack", "FingerprintPattern", "Origami"])("keeps supported icon %s instead of a fixed subset", (name) => {
        const html = renderToStaticMarkup(createElement(LucideIcon, { name, size: 36 }));
        expect(html).toContain("<svg");
        expect(html).toContain('width="36"');
        expect(html).not.toContain("Unknown icon");
    });

    it("retains the existing placeholder for truly unknown icons", () => {
        const html = renderToStaticMarkup(createElement(LucideIcon, { name: "NotAnInstalledIcon", size: 20 }));
        expect(html).toContain("Unknown icon: NotAnInstalledIcon");
        expect(html).not.toContain("<svg");
    });

    it("renders the default home page without any unknown icon placeholder", () => {
        const html = render(parseFrontPageConfig(null));
        expect(html).not.toContain("Unknown icon");
    });

    it.each(["Github", "GitHub"])("renders the inline GitHub mark for saved name %s", (name) => {
        const html = renderToStaticMarkup(createElement(LucideIcon, { name, size: 28 }));
        expect(html).toContain("<svg");
        expect(html).toContain('width="28"');
        expect(html).toContain('height="28"');
        expect(html).not.toContain("Unknown icon");
    });

    it("renders a replacement icon for the legacy Music name", () => {
        const html = renderToStaticMarkup(createElement(LucideIcon, { name: "Music", size: 24 }));
        expect(html).toContain("<svg");
        expect(html).not.toContain("Unknown icon");
    });

    it("only maps aliases to icons that exist in the installed lucide-react", () => {
        for (const [legacyName, target] of Object.entries(legacyIconAliases)) {
            expect(target, `alias ${legacyName}`).toBeTypeOf("string");
            expect(target in icons, `alias ${legacyName} -> ${target}`).toBe(true);
        }
    });
});
