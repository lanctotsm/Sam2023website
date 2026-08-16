import { NextResponse } from "next/server";
import { getAuthUser, errorResponse } from "@/lib/api-utils";
import { getResume, saveResume } from "@/services/resume";
import { renderAndPublishResumePdf } from "@/services/resumePdf";

export async function GET() {
    const doc = await getResume();
    return NextResponse.json(doc);
}

export async function PUT(request: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthorized", 401);
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return errorResponse("Invalid JSON body", 400);
    }

    // The document is persisted first; the PDF render reports its own status
    // so a Typst failure can never fail the save.
    const resume = await saveResume(payload);
    const pdf = await renderAndPublishResumePdf(resume);
    return NextResponse.json({ resume, pdf });
}
