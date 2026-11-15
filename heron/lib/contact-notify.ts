export const CONTACT_NOTIFY_SETTING = "contact_notify_email";

const MAILBOX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactNotifyStatus = "off" | "pending" | "verified" | "failed" | "unavailable";

export type ContactNotifyView = {
    email: string;
    region: string;
    status: ContactNotifyStatus;
    notifiesByEmail: boolean;
    notice: string;
};

export type IdentitySnapshot = {
    verifiedForSending: boolean;
    verificationStatus: string | null;
};

export function contactMailRegion(env: NodeJS.ProcessEnv = process.env): string {
    return env.S3_REGION?.trim() || "us-east-1";
}

export function mailbox(value: string): string | null {
    const cleaned = value.replace(/[\r\n]+/g, "").trim();
    if (!cleaned || cleaned.length > 254 || !MAILBOX.test(cleaned)) return null;
    return cleaned;
}

export type ContactNotifyRequest =
    | { ok: true; email: string; resend: boolean }
    | { ok: false; error: string };

export function parseContactNotifyRequest(body: unknown): ContactNotifyRequest {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { ok: false, error: "Invalid request." };
    }
    const raw = body as Record<string, unknown>;
    const email = typeof raw.email === "string" ? raw.email.replace(/[\r\n]+/g, "").trim() : "";
    const resend = raw.resend === true;
    if (!email) return { ok: true, email: "", resend: false };
    if (!mailbox(email)) return { ok: false, error: "Enter a valid email address." };
    return { ok: true, email, resend };
}

export function describeIdentity(snapshot: IdentitySnapshot | null): Exclude<ContactNotifyStatus, "off" | "unavailable"> {
    if (!snapshot) return "pending";
    if (snapshot.verifiedForSending || snapshot.verificationStatus === "SUCCESS") return "verified";
    if (snapshot.verificationStatus === "FAILED") return "failed";
    return "pending";
}

export function contactNotifyView(input: {
    email: string;
    region: string;
    status: ContactNotifyStatus;
    notice?: string;
}): ContactNotifyView {
    return {
        email: input.email,
        region: input.region,
        status: input.status,
        notifiesByEmail: input.status === "verified",
        notice: input.notice ?? defaultNotice(input.status, Boolean(input.email))
    };
}

function defaultNotice(status: ContactNotifyStatus, hasEmail: boolean): string {
    if (status === "verified") return "This address is confirmed. New messages are emailed to it.";
    if (status === "failed") return "The confirmation link expired. Send it again.";
    if (status === "unavailable") {
        return "Amazon SES could not be reached. Messages are still saved in this inbox.";
    }
    if (status === "pending" && hasEmail) {
        return "Send a confirmation link to this address. Amazon emails the link.";
    }
    return "Email notification is off.";
}

export function noticeForPendingIdentity(snapshot: IdentitySnapshot | null): string {
    if (!snapshot || snapshot.verificationStatus === "NOT_STARTED") {
        return "Send a confirmation link to this address. Amazon emails the link.";
    }
    return "Amazon sent a confirmation link to this address. Open that message and click the link, then check again.";
}
