import { NextResponse } from "next/server";
import { getAuthUser, errorResponse } from "@/lib/api-utils";
import { getResume } from "@/services/resume";
import { renderAndPublishResumePdf } from "@/services/resumePdf";

/** Re-renders the PDF from the stored document without editing content —
 * recovery from a failed render or pickup of a template change. */
export async function POST() {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthorized", 401);
    }
    const doc = await getResume();
    const pdf = await renderAndPublishResumePdf(doc);
    return NextResponse.json({ pdf });
}
