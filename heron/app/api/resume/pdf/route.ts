import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { getResume } from "@/services/resume";
import { getResumePdfInfo } from "@/services/resumePdf";

/** Stable public URL for the current PDF: 302 to the content-addressed
 * object so links never go stale. A recorded URL whose source timestamp
 * does not match the stored document is treated as unavailable — save
 * persists first, so a failed re-render must not keep serving the old file. */
export async function GET() {
    const info = await getResumePdfInfo();
    if (!info) {
        return errorResponse(
            "No PDF has been generated yet. Save the resume in the admin editor to create one.",
            404
        );
    }

    const resume = await getResume();
    if (info.sourceLastModified !== resume.meta.lastModified) {
        return errorResponse(
            "The PDF is out of date because the last render failed. Save or regenerate the PDF in the admin editor.",
            404
        );
    }

    return NextResponse.redirect(info.url, 302);
}
