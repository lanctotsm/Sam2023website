import { NextResponse } from "next/server";
import { getResume } from "@/services/resume";
import { toJsonResume } from "@/lib/resume/jsonResume";
import { slugify } from "@/lib/slug";

const baseUrl = (process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

/** Public download of the canonical resume.json — the portability artifact. */
export async function GET() {
    const doc = await getResume();
    const exported = toJsonResume(doc, { canonical: `${baseUrl}/resume` });
    const filename = `${slugify(doc.basics.name) || "resume"}-resume.json`;

    return new NextResponse(JSON.stringify(exported, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`
        }
    });
}
