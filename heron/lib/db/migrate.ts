import fs from "fs";
import path from "path";
import type Database from "better-sqlite3";

type MigrationRow = { id: string };

export function migrateIfNeeded(sqlite: Database.Database) {
  sqlite.pragma("busy_timeout = 8000");
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const applied = new Set<string>(
      sqlite.prepare("SELECT id FROM _migrations").all().map((row) => (row as MigrationRow).id)
    );

    const migrationsFolder = path.join(process.cwd(), "drizzle");
    if (!fs.existsSync(migrationsFolder)) {
      sqlite.exec("COMMIT");
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsFolder)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const insertMigration = sqlite.prepare("INSERT INTO _migrations (id) VALUES (?)");

    for (const file of migrationFiles) {
      if (applied.has(file)) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsFolder, file), "utf8");
      sqlite.exec(sql);
      insertMigration.run(file);
    }

    sqlite.exec("COMMIT");
  } catch (error) {
    try {
      sqlite.exec("ROLLBACK");
    } catch {
      // Transaction may already be closed.
    }
    throw error;
  }
}
