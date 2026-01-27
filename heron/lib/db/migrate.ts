import fs from "fs";
import path from "path";
import type Database from "better-sqlite3";

let migrated = false;

type MigrationRow = { id: string };

export function migrateIfNeeded(sqlite: Database.Database) {
  if (migrated) {
    return;
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!fs.existsSync(migrationsFolder)) {
    migrated = true;
    return;
  }

  const applied = new Set<string>(
    sqlite.prepare("SELECT id FROM _migrations").all().map((row) => (row as MigrationRow).id)
  );

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
    const transaction = sqlite.transaction(() => {
      sqlite.exec(sql);
      insertMigration.run(file);
    });

    transaction();
  }

  migrated = true;
}
