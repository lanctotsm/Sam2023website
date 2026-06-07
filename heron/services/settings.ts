import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { unstable_cache, revalidateTag } from "next/cache";

function invalidateSettingsCache() {
    try {
        revalidateTag("settings");
    } catch (err) {
        console.error("Failed to revalidate settings cache:", err);
    }
}

export async function getSetting(key: string): Promise<string | null> {
    return unstable_cache(
        async () => {
            const db = getDb();
            const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
            return rows[0]?.value ?? null;
        },
        [`setting-${key}`],
        { tags: ["settings", `setting-${key}`] }
    )();
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
    if (keys.length === 0) return {};

    // Sort keys so the cache key is deterministic regardless of request order
    const sortedKeys = [...keys].sort();
    const cacheKey = JSON.stringify(sortedKeys);

    return unstable_cache(
        async () => {
            const db = getDb();
            const rows = await db.select().from(settings).where(inArray(settings.key, sortedKeys));
            const result: Record<string, string> = {};
            for (const row of rows) {
                result[row.key] = row.value;
            }
            return result;
        },
        [`settings-batch-${cacheKey}`],
        { tags: ["settings", ...sortedKeys.map(k => `setting-${k}`)] }
    )();
}

export async function updateSetting(key: string, value: string): Promise<void> {
    const db = getDb();
    await db
        .insert(settings)
        .values({ key, value, updatedAt: sql`CURRENT_TIMESTAMP` })
        .onConflictDoUpdate({
            target: settings.key,
            set: { value, updatedAt: sql`CURRENT_TIMESTAMP` }
        });
    invalidateSettingsCache();
}

export async function updateSettings(entries: Record<string, string>): Promise<void> {
    const db = getDb();
    // better-sqlite3 is synchronous: the transaction callback must NOT be async
    // (Drizzle throws "Transaction function cannot return a promise"). Execute
    // each statement synchronously with `.run()`.
    db.transaction((tx) => {
        for (const [key, value] of Object.entries(entries)) {
            tx
                .insert(settings)
                .values({ key, value, updatedAt: sql`CURRENT_TIMESTAMP` })
                .onConflictDoUpdate({
                    target: settings.key,
                    set: { value, updatedAt: sql`CURRENT_TIMESTAMP` }
                })
                .run();
        }
    });
    invalidateSettingsCache();
}

