import nodemailer from "nodemailer";
import type { ContactSubmission } from "@/lib/contact-submission";

export type ContactMailConfig = {
    to: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
};

function trimmed(env: NodeJS.ProcessEnv, key: string): string {
    return env[key]?.trim() ?? "";
}

/** Server-only mail settings. Incomplete config means messages stay in the CMS inbox. */
export function readContactMailConfig(env: NodeJS.ProcessEnv = process.env): ContactMailConfig | null {
    const to = trimmed(env, "CONTACT_TO_EMAIL");
    const host = trimmed(env, "SMTP_HOST");
    const user = trimmed(env, "SMTP_USER");
    const pass = trimmed(env, "SMTP_PASS");
    if (!to || !host || !user || !pass) return null;

    const portRaw = trimmed(env, "SMTP_PORT");
    const port = portRaw ? Number(portRaw) : 587;
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null;

    const secureFlag = trimmed(env, "SMTP_SECURE").toLowerCase();
    const secure = secureFlag === "true" || (secureFlag !== "false" && port === 465);
    const from = trimmed(env, "SMTP_FROM") || user;

    return { to, host, port, user, pass, from, secure };
}

export function contactMailIsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
    return readContactMailConfig(env) !== null;
}

/** Sends one notification. Caller must not surface the recipient to the visitor. */
export async function sendContactMail(message: ContactSubmission, config: ContactMailConfig): Promise<void> {
    const transport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });

    await transport.sendMail({
        from: config.from,
        to: config.to,
        replyTo: message.email,
        subject: `Website message from ${message.name}`,
        text: `${message.name}\n${message.email}\n\n${message.message}`
    });
}
