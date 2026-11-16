import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ResumeView from "@/components/resume/ResumeView";
import { createDefaultResume } from "./defaults";

describe("public resume email", () => {
    it("prints the address when the public copy still includes it", () => {
        const doc = createDefaultResume();
        doc.basics.name = "Sam";
        doc.basics.email = "owner@example.com";
        const html = renderToStaticMarkup(createElement(ResumeView, { doc }));
        expect(html).toContain("owner@example.com");
        expect(html).toContain("mailto:owner@example.com");
    });

    it("still links to the contact form when the email field is empty", () => {
        const doc = createDefaultResume();
        doc.basics.name = "Sam";
        const html = renderToStaticMarkup(createElement(ResumeView, { doc }));
        expect(html).toContain('href="/#contact"');
        expect(html).toContain(">Contact<");
    });
});
