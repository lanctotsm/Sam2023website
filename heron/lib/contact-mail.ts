import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { ContactSubmission } from "@/lib/contact-submission";

export type ContactMailConfig = {
    to: string;
    from: string;
    region: string;
};

function trimmed(env: NodeJS.ProcessEnv, key: string): string {
    return env[key]?.trim() ?? "";
}

/**
 * Server-only Amazon SES settings. Incomplete config means messages stay in
 * the CMS inbox. The From address must be a verified SES identity in `region`.
 */
export function readContactMailConfig(env: NodeJS.ProcessEnv = process.env): ContactMailConfig | null {
    const to = trimmed(env, "CONTACT_TO_EMAIL");
    const from = trimmed(env, "CONTACT_FROM_EMAIL");
    if (!to || !from) return null;
    const region = trimmed(env, "S3_REGION") || "us-east-1";
    return { to, from, region };
}

export function contactMailIsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
    return readContactMailConfig(env) !== null;
}

function sesClient(config: ContactMailConfig, env: NodeJS.ProcessEnv): SESv2Client {
    const accessKeyId = trimmed(env, "AWS_ACCESS_KEY_ID");
    const secretAccessKey = trimmed(env, "AWS_SECRET_ACCESS_KEY");
    return new SESv2Client({
        region: config.region,
        credentials:
            accessKeyId && secretAccessKey
                ? { accessKeyId, secretAccessKey }
                : undefined
    });
}

/** Sends one notification through SES. Caller must not surface the recipient. */
export async function sendContactMail(
    message: ContactSubmission,
    config: ContactMailConfig,
    env: NodeJS.ProcessEnv = process.env
): Promise<void> {
    const client = sesClient(config, env);
    await client.send(
        new SendEmailCommand({
            FromEmailAddress: config.from,
            Destination: { ToAddresses: [config.to] },
            ReplyToAddresses: [message.email],
            Content: {
                Simple: {
                    Subject: {
                        Data: `Website message from ${message.name}`,
                        Charset: "UTF-8"
                    },
                    Body: {
                        Text: {
                            Data: `${message.name}\n${message.email}\n\n${message.message}`,
                            Charset: "UTF-8"
                        }
                    }
                }
            }
        })
    );
}
