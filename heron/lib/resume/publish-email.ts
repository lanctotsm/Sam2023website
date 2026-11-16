import type { ResumeDocument } from "./types";

/** Missing or any value other than "true" keeps the address off public surfaces. */
export const RESUME_PUBLISH_EMAIL_SETTING = "resume_publish_email";

export function resumeEmailIsPublic(value: string | null | undefined): boolean {
    return value === "true";
}

/** Clears the address unless an admin has turned public email on. */
export function resumeForPublic(doc: ResumeDocument, publishEmail: boolean): ResumeDocument {
    if (publishEmail) return doc;
    return { ...doc, basics: { ...doc.basics, email: "" } };
}
