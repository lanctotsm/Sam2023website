import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { deleteContactMessage } from "@/services/contact-messages";

export async function DELETE(_: Request, { params }: { params: Promise<{ messageID: string }> }) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("unauthorized", 401);
    }

    const { messageID } = await params;
    const id = parseId(messageID);
    if (!id) {
        return errorResponse("invalid message id", 400);
    }

    const removed = await deleteContactMessage(id);
    if (!removed) {
        return errorResponse("message not found", 404);
    }

    return NextResponse.json({ status: "removed" });
}
