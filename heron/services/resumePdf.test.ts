import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { sanitizeResumeDocument } from "@/lib/resume/parse";

const { mockExecFile } = vi.hoisted(() => ({ mockExecFile: vi.fn() }));

vi.mock("node:child_process", () => ({ execFile: mockExecFile }));

vi.mock("node:fs/promises", () => ({
    mkdtemp: vi.fn().mockResolvedValue("/tmp/resume-pdf-test"),
    readFile: vi.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
    rm: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@/lib/s3", () => ({ putObject: vi.fn() }));

vi.mock("@/services/settings", () => ({
    getSetting: vi.fn(),
    updateSetting: vi.fn()
}));

const { putObject } = await import("@/lib/s3");
const { getSetting, updateSetting } = await import("@/services/settings");
const { renderAndPublishResumePdf, getResumePdfInfo, RESUME_PDF_SETTING_KEY } = await import(
    "./resumePdf"
);

type ExecCallback = (error: Error | null, stdout: string, stderr: string) => void;

function execSucceeds() {
    mockExecFile.mockImplementation((_file, _args, _options, callback: ExecCallback) => {
        callback(null, "", "");
    });
}

function execFails(error: Error) {
    mockExecFile.mockImplementation((_file, _args, _options, callback: ExecCallback) => {
        callback(error, "", "");
    });
}

function sampleDoc() {
    const doc = sanitizeResumeDocument({ basics: { name: "Sam Lanctot" } });
    doc.meta.lastModified = "2026-08-15T00:00:00.000Z";
    return doc;
}

describe("services/resumePdf", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(putObject).mockResolvedValue(undefined);
        vi.mocked(updateSetting).mockResolvedValue(undefined);
        vi.mocked(getSetting).mockResolvedValue(null);
        process.env.S3_PUBLIC_BASE_URL = "https://cdn.example.com/cms";
        execSucceeds();
    });

    afterEach(() => {
        delete process.env.S3_PUBLIC_BASE_URL;
        delete process.env.TYPST_PATH;
    });

    it("invokes typst via execFile without a shell and with --ignore-system-fonts", async () => {
        await renderAndPublishResumePdf(sampleDoc());
        expect(mockExecFile).toHaveBeenCalledTimes(1);
        const [file, args, options] = mockExecFile.mock.calls[0];
        expect(file).toBe("typst");
        expect(args[0]).toBe("compile");
        expect(args).toContain("--ignore-system-fonts");
        expect(options).not.toHaveProperty("shell");
        expect(options.timeout).toBeGreaterThan(0);
        const inputIndex = args.indexOf("--input");
        expect(String(args[inputIndex + 1]).startsWith("data={")).toBe(true);
    });

    it("uploads under a key containing the lastModified hash and records the URL", async () => {
        const doc = sampleDoc();
        const hash = createHash("sha256").update(doc.meta.lastModified).digest("hex").slice(0, 8);
        const result = await renderAndPublishResumePdf(doc);

        expect(putObject).toHaveBeenCalledWith(
            expect.objectContaining({
                key: `resume/sam-lanctot-resume-${hash}.pdf`,
                contentType: "application/pdf"
            })
        );
        expect(result.status).toBe("ok");
        if (result.status !== "ok") throw new Error("expected ok");
        expect(result.url).toBe(`https://cdn.example.com/cms/resume/sam-lanctot-resume-${hash}.pdf`);

        const [key, value] = vi.mocked(updateSetting).mock.calls[0];
        expect(key).toBe(RESUME_PDF_SETTING_KEY);
        expect(JSON.parse(value)).toMatchObject({
            url: result.url,
            sourceLastModified: doc.meta.lastModified
        });
    });

    it("surfaces stderr as the error on a non-zero exit and skips S3", async () => {
        const error = Object.assign(new Error("Command failed"), {
            stderr: "error: unknown font family: Fraunces"
        });
        execFails(error);
        const result = await renderAndPublishResumePdf(sampleDoc());
        expect(result.status).toBe("failed");
        if (result.status === "ok") throw new Error("expected failure");
        expect(result.error).toContain("unknown font family");
        expect(putObject).not.toHaveBeenCalled();
        expect(updateSetting).not.toHaveBeenCalled();
    });

    it("degrades to unavailable when the binary is missing", async () => {
        execFails(Object.assign(new Error("spawn typst ENOENT"), { code: "ENOENT" }));
        const result = await renderAndPublishResumePdf(sampleDoc());
        expect(result.status).toBe("unavailable");
        expect(putObject).not.toHaveBeenCalled();
    });

    it("reports failure rather than throwing when the S3 upload fails", async () => {
        vi.mocked(putObject).mockRejectedValue(new Error("bucket unreachable"));
        const result = await renderAndPublishResumePdf(sampleDoc());
        expect(result.status).toBe("failed");
        expect(updateSetting).not.toHaveBeenCalled();
    });

    it("getResumePdfInfo parses the recorded setting and returns null when absent", async () => {
        expect(await getResumePdfInfo()).toBeNull();
        vi.mocked(getSetting).mockResolvedValue(
            JSON.stringify({
                url: "https://cdn.example.com/cms/resume/x.pdf",
                generatedAt: "2026-08-15T00:00:00.000Z",
                sourceLastModified: "2026-08-15T00:00:00.000Z"
            })
        );
        const info = await getResumePdfInfo();
        expect(info?.url).toBe("https://cdn.example.com/cms/resume/x.pdf");
    });
});
