import { NextResponse } from "next/server";
import { errorResponse, getAuthUser } from "@/lib/api-utils";
import { parsePostsPageConfig } from "@/lib/postsPage";
import { getSetting, getSettings, updateSetting, updateSettings } from "@/services/settings";

function normalizeSettingValue(key: string, value: string): string {
    if (key === "posts_page") {
        return JSON.stringify(parsePostsPageConfig(value));
    }
    return value;
}

// Settings change immediately after a save (see services/settings.ts), and the
// admin Settings page relies on GET here always reflecting the latest values —
// never a browser/CDN-cached response from an earlier visit.
// Cache-Control: no-store keeps this response out of a browser or CDN cache.

function jsonNoStore(body: unknown, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
}

const ALLOWED_SETTING_KEYS = new Set([
    "site_title",
    "footer_text",
    "front_page",
    "posts_page",
    "page_styles",
    "nav_styles",
    "ai_alt_text_enabled",
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
        return jsonNoStore({ key, value });
    }

    if (keys) {
        const keyList = keys.split(",").map((k) => k.trim()).filter(Boolean);
        const result = await getSettings(keyList);
        return jsonNoStore(result);
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
    if (typeof payload.key === "string" && payload.key.length > 0 && typeof payload.value === "string") {
        if (!ALLOWED_SETTING_KEYS.has(payload.key)) {
            return errorResponse(`unknown setting key: ${payload.key}`, 400);
        }
        if (payload.value.length > MAX_VALUE_LENGTH) {
            return errorResponse("value too large", 400);
        }
        await updateSetting(payload.key, normalizeSettingValue(payload.key, payload.value));
        return NextResponse.json({ ok: true });
    }

    // Batch update: { settings: { key1: "val1", key2: "val2" } }
    if (payload.settings !== null && typeof payload.settings === "object" && !Array.isArray(payload.settings)) {
        const entries = payload.settings as Record<string, string>;
        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(entries)) {
            if (!ALLOWED_SETTING_KEYS.has(key)) {
                return errorResponse(`unknown setting key: ${key}`, 400);
            }
            if (typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
                return errorResponse(`invalid or too-large value for key: ${key}`, 400);
            }
            normalized[key] = normalizeSettingValue(key, value);
        }
        await updateSettings(normalized);
        return NextResponse.json({ ok: true });
    }

    return errorResponse("invalid payload", 400);
}
