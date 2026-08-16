import { getSetting, updateSetting } from "@/services/settings";
import { parseResumeDocument, sanitizeResumeDocument } from "@/lib/resume/parse";
import type { ResumeDocument } from "@/lib/resume/types";

export const RESUME_SETTING_KEY = "resume";

export async function getResume(): Promise<ResumeDocument> {
    const raw = await getSetting(RESUME_SETTING_KEY);
    return parseResumeDocument(raw);
}

/** Sanitizes the incoming payload, stamps `meta.lastModified`, and upserts the
 * settings row. Returns the document as persisted. */
export async function saveResume(raw: unknown): Promise<ResumeDocument> {
    const doc = sanitizeResumeDocument(raw);
    doc.meta.lastModified = new Date().toISOString();
    await updateSetting(RESUME_SETTING_KEY, JSON.stringify(doc));
    return doc;
}
