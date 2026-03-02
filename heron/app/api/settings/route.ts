import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { getSetting, getSettings, updateSetting, updateSettings } from "@/services/settings";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const keys = searchParams.get("keys");

    if (key) {
        const value = await getSetting(key);
        return NextResponse.json({ key, value });
    }

    if (keys) {
        const keyList = keys.split(",").map((k) => k.trim()).filter(Boolean);
        const result = await getSettings(keyList);
        return NextResponse.json(result);
    }

    return errorResponse("key or keys query parameter required", 400);
}

export async function PUT(request: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("unauthorized", 401);
    }

    const payload = await request.json();

    // Single key update: { key: "...", value: "..." }
    if (payload.key && typeof payload.value === "string") {
        await updateSetting(payload.key, payload.value);
        revalidateTag("settings");
        return NextResponse.json({ ok: true });
    }

    // Batch update: { settings: { key1: "val1", key2: "val2" } }
    if (payload.settings && typeof payload.settings === "object") {
        await updateSettings(payload.settings);
        revalidateTag("settings");
        return NextResponse.json({ ok: true });
    }

    return errorResponse("invalid payload", 400);
}
