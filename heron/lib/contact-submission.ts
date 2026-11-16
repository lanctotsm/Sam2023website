export type ContactSubmission = {
    name: string;
    email: string;
    message: string;
};

export type ContactParseResult =
    | { status: "ok"; value: ContactSubmission }
    | { status: "ignored" }
    | { status: "invalid"; error: string };

const VISITOR_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asRecord(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
}

function singleLine(value: string): string {
    return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Validates a public contact-form body. A filled `hp_token` is treated as a
 * bot and ignored. The result never includes the site owner's address.
 */
export function parseContactSubmission(body: unknown): ContactParseResult {
    const raw = asRecord(body);
    if (!raw) return { status: "invalid", error: "Invalid request." };

    const trap = raw.hp_token;
    if (typeof trap === "string" ? trap.trim() !== "" : trap != null) {
        return { status: "ignored" };
    }

    const name = typeof raw.name === "string" ? singleLine(raw.name) : "";
    const email = typeof raw.email === "string" ? raw.email.replace(/[\r\n]+/g, "").trim() : "";
    const message = typeof raw.message === "string" ? raw.message.trim() : "";

    if (!name) return { status: "invalid", error: "Name is required." };
    if (name.length > 80) return { status: "invalid", error: "Name is too long." };
    if (!email || email.length > 254 || !VISITOR_EMAIL.test(email)) {
        return { status: "invalid", error: "A valid email is required." };
    }
    if (!message) return { status: "invalid", error: "Message is required." };
    if (message.length > 4000) return { status: "invalid", error: "Message is too long." };

    return { status: "ok", value: { name, email, message } };
}
