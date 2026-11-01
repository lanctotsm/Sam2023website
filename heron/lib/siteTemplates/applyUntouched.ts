import type Database from "better-sqlite3";
import { isUntouchedSite } from "./compare";
import { getJournalPreset, JOURNAL_TEMPLATE_ID } from "./presets";

type SettingRow = { key: string; value: string };

/**
 * Writes Journal over an untouched site. Uses the connection migrate already
 * holds so it stays inside that transaction.
 */
export function applyJournalIfUntouched(sqlite: Database.Database): void {
    const table = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'")
        .get();
    if (!table) return;

    const rows = sqlite
        .prepare("SELECT key, value FROM settings WHERE key IN ('front_page', 'page_styles', 'nav_styles')")
        .all() as SettingRow[];
    const byKey = new Map(rows.map((row) => [row.key, row.value]));
    if (!isUntouchedSite(byKey.get("front_page") ?? null, byKey.get("page_styles") ?? null, byKey.get("nav_styles") ?? null)) {
        return;
    }

    const snapshot = getJournalPreset().snapshot;
    const upsert = sqlite.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (@key, @value, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
    `);
    const entries: SettingRow[] = [
        { key: "front_page", value: JSON.stringify(snapshot.front_page) },
        { key: "page_styles", value: JSON.stringify(snapshot.page_styles) },
        { key: "nav_styles", value: JSON.stringify(snapshot.nav_styles) },
        { key: "active_template", value: JOURNAL_TEMPLATE_ID },
    ];
    for (const entry of entries) {
        upsert.run(entry);
    }
}
