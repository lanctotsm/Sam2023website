import { NextResponse } from "next/server";
import { errorResponse, getAuthUser, parseId } from "@/lib/api-utils";
import { removeUser } from "@/actions/admin-users";

export async function DELETE(_: Request, { params }: { params: Promise<{ userID: string }> }) {
  const { userID } = await params;
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const id = parseId(userID);
  if (!id) {
    return errorResponse("invalid user id", 400);
  }

  try {
    await removeUser(id);
    return NextResponse.json({ status: "removed" });
  } catch (error: any) {
    const message = error?.message || "failed to remove user";
    const status = message.includes("cannot remove") ? 403 : message.includes("not found") ? 404 : 400;
    return errorResponse(message, status);
  }
}
