import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { getSetting, getSettings, updateSetting, updateSettings } from "@/services/settings";

const ALLOWED_SETTING_KEYS = new Set([
    "site_title",
    "footer_text",
    "front_page",
]);

const MAX_VALUE_LENGTH = 100_000; // 100 KB

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("unauthorized", 401);
    }

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
        if (!ALLOWED_SETTING_KEYS.has(payload.key)) {
            return errorResponse(`unknown setting key: ${payload.key}`, 400);
        }
        if (payload.value.length > MAX_VALUE_LENGTH) {
            return errorResponse("value too large", 400);
        }
        await updateSetting(payload.key, payload.value);
        return NextResponse.json({ ok: true });
    }

    // Batch update: { settings: { key1: "val1", key2: "val2" } }
    if (payload.settings && typeof payload.settings === "object") {
        const entries = payload.settings as Record<string, string>;
        for (const [key, value] of Object.entries(entries)) {
            if (!ALLOWED_SETTING_KEYS.has(key)) {
                return errorResponse(`unknown setting key: ${key}`, 400);
            }
            if (typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
                return errorResponse(`invalid or too-large value for key: ${key}`, 400);
            }
        }
        await updateSettings(entries);
        return NextResponse.json({ ok: true });
    }

    return errorResponse("invalid payload", 400);
}
