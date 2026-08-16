/** Renders the resume PDF by spawning the Typst binary and publishes the
 * result to S3 under a content-addressed key. Deliberately outside the
 * JavaScript rendering stack: nothing here depends on React or Next. */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { putObject } from "@/lib/s3";
import { getSetting, updateSetting } from "@/services/settings";
import { slugify } from "@/lib/slug";
import { toJsonResume } from "@/lib/resume/jsonResume";
import type { ResumeDocument } from "@/lib/resume/types";

export const RESUME_PDF_SETTING_KEY = "resume_pdf";

const TYPST_TIMEOUT_MS = 15_000;

export type ResumePdfInfo = {
    url: string;
    generatedAt: string;
    sourceLastModified: string;
};

export type ResumePdfResult =
    | { status: "ok"; url: string; generatedAt: string }
    | { status: "failed" | "unavailable"; error: string };

function typstBinary(): string {
    return process.env.TYPST_PATH?.trim() || "typst";
}

function templateDir(): string {
    return (
        process.env.RESUME_TEMPLATE_DIR?.trim() || path.join(process.cwd(), "resume-template")
    );
}

type ExecError = Error & { code?: string | number; stderr?: string };

/** execFile with a callback wrapped by hand (rather than promisify) so the
 * failure path reliably carries stderr, which holds Typst's diagnostics. */
function runTypst(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        execFile(
            typstBinary(),
            args,
            { timeout: TYPST_TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 },
            (error: ExecError | null, _stdout: string, stderr: string) => {
                if (!error) {
                    resolve();
                    return;
                }
                if (!error.stderr && stderr) {
                    error.stderr = stderr;
                }
                reject(error);
            }
        );
    });
}

export async function renderAndPublishResumePdf(doc: ResumeDocument): Promise<ResumePdfResult> {
    const publicBase = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
    if (!publicBase) {
        return { status: "failed", error: "S3_PUBLIC_BASE_URL is not configured" };
    }

    const dir = templateDir();
    const payload = JSON.stringify(toJsonResume(doc));

    let workDir: string | null = null;
    try {
        workDir = await mkdtemp(path.join(tmpdir(), "resume-pdf-"));
        const outputPath = path.join(workDir, "resume.pdf");

        // Passed as a single argv element — never through a shell — so
        // user-authored content cannot become a command-injection vector.
        await runTypst([
            "compile",
            "--input",
            `data=${payload}`,
            "--font-path",
            path.join(dir, "fonts"),
            "--ignore-system-fonts",
            path.join(dir, "resume.typ"),
            outputPath
        ]);

        const pdf = await readFile(outputPath);
        const hash = createHash("sha256").update(doc.meta.lastModified).digest("hex").slice(0, 8);
        const slug = slugify(doc.basics.name) || "resume";
        const key = `resume/${slug}-resume-${hash}.pdf`;

        await putObject({ key, body: pdf, contentType: "application/pdf" });

        const url = `${publicBase}/${key}`;
        const generatedAt = new Date().toISOString();
        const info: ResumePdfInfo = {
            url,
            generatedAt,
            sourceLastModified: doc.meta.lastModified
        };
        await updateSetting(RESUME_PDF_SETTING_KEY, JSON.stringify(info));
        return { status: "ok", url, generatedAt };
    } catch (err) {
        const error = err as ExecError;
        if (error?.code === "ENOENT") {
            return {
                status: "unavailable",
                error: `Typst binary not found (looked for "${typstBinary()}"). Install Typst or set TYPST_PATH.`
            };
        }
        const detail = error?.stderr?.trim() || error?.message || "Unknown error";
        console.error("Resume PDF render failed:", detail);
        return { status: "failed", error: detail };
    } finally {
        if (workDir) {
            await rm(workDir, { recursive: true, force: true }).catch(() => {});
        }
    }
}

export async function getResumePdfInfo(): Promise<ResumePdfInfo | null> {
    const raw = await getSetting(RESUME_PDF_SETTING_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<ResumePdfInfo>;
        if (typeof parsed?.url !== "string" || !parsed.url) return null;
        return {
            url: parsed.url,
            generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : "",
            sourceLastModified:
                typeof parsed.sourceLastModified === "string" ? parsed.sourceLastModified : ""
        };
    } catch {
        return null;
    }
}
