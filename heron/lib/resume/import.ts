/** Turns pasted or uploaded JSON into a ResumeDocument, or a user-facing error.
 * Invalid JSON is a hard failure (unlike parseResumeDocument, which yields the
 * empty default — that contract is for reading a possibly-absent settings row). */

import { sanitizeResumeDocument } from "./parse";
import type { ResumeDocument } from "./types";

export type ResumeImportResult =
    | { ok: true; document: ResumeDocument }
    | { ok: false; error: string };

export function importResumeJson(text: string): ResumeImportResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return { ok: false, error: "That file is not valid JSON." };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { ok: false, error: "That file is not a JSON Resume document." };
    }
    return { ok: true, document: sanitizeResumeDocument(parsed) };
}
