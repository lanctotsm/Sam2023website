import {
    AlreadyExistsException,
    CreateEmailIdentityCommand,
    DeleteEmailIdentityCommand,
    GetEmailIdentityCommand,
    NotFoundException,
    SESv2Client,
    SendEmailCommand
} from "@aws-sdk/client-sesv2";
import type { ContactSubmission } from "@/lib/contact-submission";
import {
    CONTACT_NOTIFY_SETTING,
    contactMailRegion,
    contactNotifyView,
    describeIdentity,
    mailbox,
    noticeForPendingIdentity,
    type ContactNotifyView,
    type IdentitySnapshot
} from "@/lib/contact-notify";
import { getSetting, updateSetting } from "@/services/settings";

export type ContactMailConfig = {
    to: string;
    from: string;
    region: string;
};

function trimmed(env: NodeJS.ProcessEnv, key: string): string {
    return env[key]?.trim() ?? "";
}

function sesClient(env: NodeJS.ProcessEnv): SESv2Client {
    const accessKeyId = trimmed(env, "AWS_ACCESS_KEY_ID");
    const secretAccessKey = trimmed(env, "AWS_SECRET_ACCESS_KEY");
    return new SESv2Client({
        region: contactMailRegion(env),
        credentials:
            accessKeyId && secretAccessKey
                ? { accessKeyId, secretAccessKey }
                : undefined
    });
}

function errorName(err: unknown): string {
    if (err && typeof err === "object" && "name" in err && typeof (err as { name: unknown }).name === "string") {
        return (err as { name: string }).name;
    }
    return "";
}

function isNotFound(err: unknown): boolean {
    return err instanceof NotFoundException || errorName(err) === "NotFoundException";
}

function isAlreadyExists(err: unknown): boolean {
    return err instanceof AlreadyExistsException || errorName(err) === "AlreadyExistsException";
}

function noticeForSesError(err: unknown): string {
    const name = errorName(err);
    if (name === "AccessDenied" || name === "AccessDeniedException" || name === "UnauthorizedException") {
        return "Amazon SES denied the request. Deploy the updated server permissions, then try again.";
    }
    return "Amazon SES could not be reached. Messages are still saved in this inbox.";
}

async function readIdentity(client: SESv2Client, email: string): Promise<IdentitySnapshot | null> {
    try {
        const result = await client.send(new GetEmailIdentityCommand({ EmailIdentity: email }));
        return {
            verifiedForSending: result.VerifiedForSendingStatus === true,
            verificationStatus: result.VerificationStatus ?? null
        };
    } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
    }
}

async function createIdentity(client: SESv2Client, email: string): Promise<IdentitySnapshot> {
    try {
        const result = await client.send(new CreateEmailIdentityCommand({ EmailIdentity: email }));
        const verified = result.VerifiedForSendingStatus === true;
        return {
            verifiedForSending: verified,
            verificationStatus: verified ? "SUCCESS" : "PENDING"
        };
    } catch (err) {
        if (!isAlreadyExists(err)) throw err;
        const existing = await readIdentity(client, email);
        return existing ?? { verifiedForSending: false, verificationStatus: "PENDING" };
    }
}

async function deleteIdentity(client: SESv2Client, email: string): Promise<void> {
    try {
        await client.send(new DeleteEmailIdentityCommand({ EmailIdentity: email }));
    } catch (err) {
        if (isNotFound(err)) return;
        throw err;
    }
}

function viewForSnapshot(email: string, snapshot: IdentitySnapshot | null, env: NodeJS.ProcessEnv): ContactNotifyView {
    const status = describeIdentity(snapshot);
    const notice = status === "pending" ? noticeForPendingIdentity(snapshot) : undefined;
    return contactNotifyView({ email, region: contactMailRegion(env), status, notice });
}

async function storedEmail(): Promise<string> {
    const raw = await getSetting(CONTACT_NOTIFY_SETTING);
    return mailbox(raw ?? "") ?? "";
}

export async function loadContactNotifyView(env: NodeJS.ProcessEnv = process.env): Promise<ContactNotifyView> {
    const email = await storedEmail();
    if (!email) return contactNotifyView({ email: "", region: contactMailRegion(env), status: "off" });
    try {
        const snapshot = await readIdentity(sesClient(env), email);
        return viewForSnapshot(email, snapshot, env);
    } catch (err) {
        console.error("Contact identity could not be checked.", errorName(err));
        return contactNotifyView({
            email,
            region: contactMailRegion(env),
            status: "unavailable",
            notice: noticeForSesError(err)
        });
    }
}

export async function applyContactNotify(
    email: string,
    resend: boolean,
    env: NodeJS.ProcessEnv = process.env
): Promise<ContactNotifyView> {
    const region = contactMailRegion(env);
    await updateSetting(CONTACT_NOTIFY_SETTING, email);
    if (!email) return contactNotifyView({ email: "", region, status: "off" });

    try {
        const client = sesClient(env);
        const snapshot = resend
            ? await (async () => {
                  await deleteIdentity(client, email);
                  return createIdentity(client, email);
              })()
            : await (async () => {
                  const existing = await readIdentity(client, email);
                  return existing ?? createIdentity(client, email);
              })();
        return viewForSnapshot(email, snapshot, env);
    } catch (err) {
        console.error("Contact identity request failed.", errorName(err));
        return contactNotifyView({
            email,
            region,
            status: "unavailable",
            notice: noticeForSesError(err)
        });
    }
}

/** Verified admin address, used as both the SES sender and the inbox. */
export async function loadContactMailConfig(env: NodeJS.ProcessEnv = process.env): Promise<ContactMailConfig | null> {
    const email = await storedEmail();
    if (!email) return null;
    try {
        const snapshot = await readIdentity(sesClient(env), email);
        if (describeIdentity(snapshot) !== "verified") return null;
        return { to: email, from: email, region: contactMailRegion(env) };
    } catch (err) {
        console.error("Contact identity could not be checked.", errorName(err));
        return null;
    }
}

/** Sends one notification through SES. Caller must not surface the recipient. */
export async function sendContactMail(
    message: ContactSubmission,
    config: ContactMailConfig,
    env: NodeJS.ProcessEnv = process.env
): Promise<void> {
    const client = sesClient(env);
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
