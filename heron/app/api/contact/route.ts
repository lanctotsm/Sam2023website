import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { readContactMailConfig, sendContactMail } from "@/lib/contact-mail";
import { parseContactSubmission } from "@/lib/contact-submission";
import { rateLimit } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request-guards";
import { createContactMessage } from "@/services/contact-messages";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

export async function POST(request: Request) {
    if (!rateLimit(`contact:${clientAddress(request)}`, LIMIT, WINDOW_MS)) {
        return errorResponse("Please wait a few minutes and try again.", 429);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse("Invalid request.", 400);
    }

    const parsed = parseContactSubmission(body);
    if (parsed.status === "invalid") {
        return errorResponse(parsed.error, 400);
    }
    if (parsed.status === "ignored") {
        return NextResponse.json({ ok: true });
    }

    try {
        await createContactMessage(parsed.value);
    } catch {
        console.error("Failed to store contact message.");
        return errorResponse("Something went wrong. Please try again.", 500);
    }

    const mail = readContactMailConfig();
    if (mail) {
        try {
            await sendContactMail(parsed.value, mail);
        } catch {
            console.error("Contact email could not be sent.");
        }
    }

    return NextResponse.json({ ok: true });
}
