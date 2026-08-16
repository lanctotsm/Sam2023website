/** Real-binary render check: compiles the actual template with the actual
 * fonts and asserts a plausible PDF comes out. Skips itself when Typst is not
 * installed, so machines without the binary stay green. This is the test that
 * catches a broken template or a missing font file — the failure modes mocks
 * structurally cannot see. */

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const templateDir = path.join(process.cwd(), "resume-template");

function findTypst(): string | null {
    const candidate = process.env.TYPST_PATH?.trim() || "typst";
    try {
        execFileSync(candidate, ["--version"], { stdio: "ignore", windowsHide: true });
        return candidate;
    } catch {
        return null;
    }
}

const typst = findTypst();

describe.skipIf(!typst)("resume-template real render", () => {
    it("compiles the sample document to a plausible PDF", () => {
        const payload = readFileSync(path.join(templateDir, "sample-data.json"), "utf8");
        const workDir = mkdtempSync(path.join(tmpdir(), "resume-render-test-"));
        const outputPath = path.join(workDir, "resume.pdf");
        try {
            execFileSync(
                typst!,
                [
                    "compile",
                    "--input",
                    `data=${payload}`,
                    "--font-path",
                    path.join(templateDir, "fonts"),
                    "--ignore-system-fonts",
                    path.join(templateDir, "resume.typ"),
                    outputPath
                ],
                { timeout: 30_000, windowsHide: true }
            );
            const pdf = readFileSync(outputPath);
            expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
            expect(pdf.length).toBeGreaterThan(10_000);
        } finally {
            rmSync(workDir, { recursive: true, force: true });
        }
    });

    it("compiles when a date field is not a valid YYYY-MM value", () => {
        const payload = JSON.stringify({
            basics: { name: "Date Guard" },
            work: [
                {
                    id: "w1",
                    name: "Acme",
                    position: "Engineer",
                    startDate: "Present",
                    highlights: ["did things"]
                }
            ],
            meta: {
                heron: {
                    sectionOrder: ["work"],
                    hiddenSections: [],
                    condensedWorkIds: [],
                    customSections: []
                }
            }
        });
        const workDir = mkdtempSync(path.join(tmpdir(), "resume-render-bad-date-"));
        const outputPath = path.join(workDir, "resume.pdf");
        try {
            execFileSync(
                typst!,
                [
                    "compile",
                    "--input",
                    `data=${payload}`,
                    "--font-path",
                    path.join(templateDir, "fonts"),
                    "--ignore-system-fonts",
                    path.join(templateDir, "resume.typ"),
                    outputPath
                ],
                { timeout: 30_000, windowsHide: true }
            );
            const pdf = readFileSync(outputPath);
            expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
        } finally {
            rmSync(workDir, { recursive: true, force: true });
        }
    });
});
