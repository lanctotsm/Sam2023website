import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { loadContactMailConfig } from "@/lib/contact-mail";
import { listContactMessages } from "@/services/contact-messages";

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("unauthorized", 401);
    }

    const rows = await listContactMessages();
    return NextResponse.json({
        notifiesByEmail: (await loadContactMailConfig()) !== null,
        messages: rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            message: row.message,
            created_at: row.createdAt
        }))
    });
}
