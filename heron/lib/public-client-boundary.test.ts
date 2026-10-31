import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const heronRoot = path.resolve(__dirname, "..");

function source(relativePath: string): string {
    return readFileSync(path.join(heronRoot, relativePath), "utf8");
}

describe("public client boundary", () => {
    it("keeps homepage views on the server and editors in the admin bundle", () => {
        const registry = source("components/home/sectionRegistry.tsx");
        expect(registry).not.toMatch(/["']use client["']/);
        expect(registry).not.toMatch(/SectionEditor/);
        expect(registry).not.toMatch(/sectionEditorRegistry/);
        expect(registry).not.toMatch(/LucideIcon/);

        expect(source("components/FrontPageContent.tsx")).not.toMatch(/["']use client["']/);
        expect(source("components/home/ServerLucideIcon.tsx")).not.toMatch(/["']use client["']/);

        for (const name of ["Banner", "TextBlock", "CardGrid", "TagList", "Contact"]) {
            expect(source(`components/home/templates/${name}SectionView.tsx`)).not.toMatch(/["']use client["']/);
            expect(source(`components/home/templates/${name}SectionEditor.tsx`)).toMatch(/["']use client["']/);
        }

        const editorRegistry = source("components/home/sectionEditorRegistry.tsx");
        expect(editorRegistry).toMatch(/["']use client["']/);
        expect(editorRegistry).not.toMatch(/SectionView/);
    });

    it("does not mount the session client on public pages", () => {
        const nav = source("components/Navigation.tsx");
        expect(nav).not.toMatch(/["']use client["']/);
        expect(nav).not.toMatch(/useSession/);
        expect(nav).not.toMatch(/Checking session/);
        expect(source("app/providers.tsx")).not.toMatch(/SessionProvider/);
        expect(source("app/admin/layout.tsx")).toMatch(/AdminSessionProvider/);
        expect(source("components/ManageAlbumLink.tsx")).not.toMatch(/useSession/);
    });
});
