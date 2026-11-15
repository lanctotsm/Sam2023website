import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { applyContactNotify, loadContactNotifyView } from "@/lib/contact-mail";
import { parseContactNotifyRequest } from "@/lib/contact-notify";

export async function GET() {
    const user = await getAuthUser();
    if (!user) return errorResponse("unauthorized", 401);
    return NextResponse.json(await loadContactNotifyView());
}

export async function PUT(request: Request) {
    const user = await getAuthUser();
    if (!user) return errorResponse("unauthorized", 401);

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse("Invalid request.", 400);
    }

    const parsed = parseContactNotifyRequest(body);
    if (!parsed.ok) return errorResponse(parsed.error, 400);

    return NextResponse.json(await applyContactNotify(parsed.email, parsed.resend));
}
