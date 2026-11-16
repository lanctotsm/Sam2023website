import { NextResponse } from "next/server";
import { getAuthUser, errorResponse } from "@/lib/api-utils";
import { RESUME_PUBLISH_EMAIL_SETTING, resumeEmailIsPublic, resumeForPublic } from "@/lib/resume/publish-email";
import { getResume, saveResume } from "@/services/resume";
import { renderAndPublishResumePdf } from "@/services/resumePdf";
import { getSetting } from "@/services/settings";

export async function GET() {
    const doc = await getResume();
    const user = await getAuthUser();
    if (user) return NextResponse.json(doc);
    const publish = resumeEmailIsPublic(await getSetting(RESUME_PUBLISH_EMAIL_SETTING));
    return NextResponse.json(resumeForPublic(doc, publish));
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
