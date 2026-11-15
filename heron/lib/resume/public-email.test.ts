import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ResumeView from "@/components/resume/ResumeView";
import { createDefaultResume } from "./defaults";

describe("public resume email", () => {
    it("links to the contact form instead of printing the address", () => {
        const doc = createDefaultResume();
        doc.basics.name = "Sam";
        doc.basics.email = "owner@example.com";
        const html = renderToStaticMarkup(createElement(ResumeView, { doc }));
        expect(html).toContain('href="/#contact"');
        expect(html).toContain(">Contact<");
        expect(html).not.toContain("owner@example.com");
        expect(html).not.toContain("mailto:");
    });
});
