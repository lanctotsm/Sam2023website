import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { getResumePdfInfo } from "@/services/resumePdf";

/** Stable public URL for the current PDF: 302 to the content-addressed
 * object so links never go stale. */
export async function GET() {
    const info = await getResumePdfInfo();
    if (!info) {
        return errorResponse(
            "No PDF has been generated yet. Save the resume in the admin editor to create one.",
            404
        );
    }
    return NextResponse.redirect(info.url, 302);
}
